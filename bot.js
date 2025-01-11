const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Bot tokenini kiriting
const token = '7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg';
const bot = new TelegramBot(token, { polling: true });

// Test natijalarini saqlash uchun fayl nomi
const TEST_RESULTS_FILE = 'test_results.json';

// Test natijalarini yuklash
function loadTestResults() {
    try {
        return JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf-8'));
    } catch (e) {
        return {};
    }
}

// Test natijalarini saqlash
function saveTestResults(data) {
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(data, null, 4));
}

// Unikal ID yaratish
function generateUserId() {
    return Math.floor(Math.random() * 900000) + 100000; // 6 raqamli tasodifiy ID
}

// Ma'lumotlarni saqlash
let testResults = loadTestResults();

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Foydalanuvchini tekshirish
    if (testResults[chatId]) {
        const user = testResults[chatId];
        bot.sendMessage(chatId, `Siz ro'yxatdan o'tgansiz.\n\nID: ${user.id}\nIsm: ${user.name}\nYosh: ${user.age}\nTelefon: ${user.phone}\nFan yo'nalishi: ${user.subject}\nTo'lov usuli: ${user.payment_method}\n\n\n Bo't mualifi: @yusuf_1broo `);
    } else {
        // Yangi foydalanuvchi uchun yangi yozuv yaratish
        testResults[chatId] = { id: generateUserId(), state: 'ASK_NAME' };
        saveTestResults(testResults);

        bot.sendMessage(chatId, "🔤 Ism va Familyangizni kiriting:");
    }
});

// Har bir xabarni qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Foydalanuvchi mavjudligini tekshirish
    if (!testResults[chatId]) return;

    const userData = testResults[chatId];

    switch (userData.state) {
        case 'ASK_NAME':
            askName(msg, userData, chatId);
            break;
        case 'ASK_AGE':
            askAge(msg, userData, chatId);
            break;
        case 'ASK_PHONE':
            askPhone(msg, userData, chatId);
            break;
    }
});

// Ismni so'rash
function askName(msg, userData, chatId) {
    const name = msg.text;
    if (!/^[a-zA-Z ]+$/.test(name)) {
        bot.sendMessage(chatId, "❌ Iltimos, faqat harflardan foydalaning.");
        return;
    }

    userData.name = name;
    userData.state = 'ASK_AGE';
    saveTestResults(testResults);

    bot.sendMessage(chatId, "👤 Yoshingizni kiriting:");
}

// Yoshni so'rash
function askAge(msg, userData, chatId) {
    const age = parseInt(msg.text, 10);
    if (isNaN(age) || age <= 0 || age > 50) {
        bot.sendMessage(chatId, "❌ Iltimos, haqiqiy yosh kiriting.");
        return;
    }

    userData.age = age;
    userData.state = 'ASK_PHONE';
    saveTestResults(testResults);

    bot.sendMessage(chatId, "📞 Telefon raqamingizni kiriting:");
}

// Telefon raqamini so'rash
function askPhone(msg, userData, chatId) {
    const phoneNumber = msg.text;
    if (!/^\d{9,}$/.test(phoneNumber)) {
        bot.sendMessage(chatId, "❌ Iltimos, haqiqiy telefon raqamini kiriting.");
        return;
    }

    userData.phone = phoneNumber;
    userData.state = 'ASK_SUBJECT';
    saveTestResults(testResults);

    // Keyingi bosqich (fan yo'nalishlari)
    const subjects = [
        ["📚 Matematika Fizika", "📘 Matematika Ingliz tili"],
        ["📖 Matematika Ona tili", "🧪 Kimyo Biologiya"],
        ["🌍 Ingliz tili Ona tili", "⚖️ Xuquq Ingliz tili"],
        ["🏔️ Tarix Geografiya", "📊 Matematika Geografiya"],
        ["📒 Ona tili Biologiya", "📜 Tarix Ona tili"],
        ["🏫 PM maktablari", "🏛️ Al Xorazmiy maktab"],
        ["📈 Multilevel (Mock)", "🎯 IELTS (mock)"],
    ];

    const options = {
        reply_markup: {
            inline_keyboard: subjects.map(row => row.map(subject => ({
                text: subject,
                callback_data: subject
            })))
        }
    };

    bot.sendMessage(chatId, "📚 Quyidagi yo'nalishlardan birini tanlang:", options);
    bot.once('callback_query', (callbackQuery) => askSubject(callbackQuery, userData, chatId));
}

// Fan yo'nalishini so'rash
function askSubject(callbackQuery, userData, chatId) {
    const subject = callbackQuery.data;
    userData.subject = subject;

    const paymentOptions = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Offline", callback_data: "offline" }, { text: "Online", callback_data: "online" }]
            ]
        }
    };

    bot.editMessageText("To'lov usulini tanlang:", { chat_id: chatId, message_id: callbackQuery.message.message_id, reply_markup: paymentOptions });
    bot.once('callback_query', (callbackQuery) => askPayment(callbackQuery, userData, chatId));
}

// To'lov usulini so'rash
function askSubject(callbackQuery, userData, chatId) {
    const subject = callbackQuery.data;
    userData.subject = subject;
    userData.state = 'ASK_PAYMENT';
    saveTestResults(testResults);

    const paymentOptions = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "💵 Offline", callback_data: "offline" },
                    { text: "💳 Online", callback_data: "online" }
                ]
            ]
        }
    };

    bot.sendMessage(chatId, "💰 To'lov usulini tanlang:", paymentOptions);
}

// To'lov usulini qayta ishlash
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userData = testResults[chatId];

    if (!userData || userData.state !== 'ASK_PAYMENT') return;

    const paymentMethod = callbackQuery.data;
    userData.payment_method = paymentMethod;
    saveTestResults(testResults);

    if (paymentMethod === "offline") {
        bot.sendMessage(
            chatId,
            `✅ Hurmatli ${userData.name},\nMa'lumotlaringiz saqlandi. To'lovni offline amalga oshirishingiz mumkin.\n📋 Sizning ID: ${userData.id}`
        );
    } else if (paymentMethod === "online") {
        bot.sendMessage(
            chatId,
            `✅ Hurmatli ${userData.name},\n💳 To'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\n💳 Karta: 9860 1201 1404 7869\n👨‍🏫 Ega: @Ozodbekmath_teacher\n\n📋 Sizning ID: ${userData.id}\nTo'lovni amalga oshirgach, adminga murojaat qiling!`
        );
    }

    // "Test natijasini ko'rish" tugmasi
    const vercelUrl = `https://test-bot-livid.vercel.app/?user_id=${userData.id}`;
    const options = {
        reply_markup: {
            inline_keyboard: [[{ text: "📊 Test natijasini ko'rish", url: vercelUrl }]]
        }
    };

    bot.sendMessage(chatId, "📊 Test natijangizni quyidagi tugma orqali ko'rishingiz mumkin:", options);
});

