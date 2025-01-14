const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Bot tokenini kiriting
const token = '7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg'; // Bot tokeningizni kiriting
const bot = new TelegramBot(token, { polling: true });

// Adminning chat ID'sini kiriting
const ADMIN_CHAT_ID = '5025075321'; // Admin chat ID'sini kiriting

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
    try {
        fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error("❌ Faylga yozishda xatolik:", error);
    }
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
        bot.sendMessage(chatId, `Siz ro'yxatdan o'tgansiz.\n\n📋 ID: ${user.id}\n🔤 Ism: ${user.name || "Noma'lum"}\n👤 Yosh: ${user.age || "Noma'lum"}\n📚 Yo'nalish: ${user.subject || "Noma'lum"}\n💰 To'lov turi: ${user.payment_method || "Noma'lum"}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📊 Test natijasi", url: `https://your-vercel-url.vercel.app/?user_id=${user.id}` }
                    ]
                ]
            }
        });
    } else {
        // Yangi foydalanuvchi uchun yangi yozuv yaratish
        testResults[chatId] = { id: generateUserId(), state: 'ASK_NAME' };
        saveTestResults(testResults);

        bot.sendMessage(chatId, "🔤 Ism va Familyangizni kiriting:");
    }
});

// Xabarlarni qayta ishlash
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
        case 'ASK_SUBJECT':
            askSubject(userData, chatId);
            break;
        case 'ASK_PAYMENT':
            askPayment(userData, chatId);
            break;
    }
});

// Ismni so'rash
function askName(msg, userData, chatId) {
    const name = msg.text;
    userData.name = name;
    userData.state = 'ASK_AGE';
    saveTestResults(testResults);

    bot.sendMessage(chatId, "👤 Yoshingizni kiriting:");
}

// Yoshni so'rash
function askAge(msg, userData, chatId) {
    const age = parseInt(msg.text, 10);
    userData.age = age;
    userData.state = 'ASK_SUBJECT';
    saveTestResults(testResults);

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
}

// Fan yo'nalishini tanlash
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userData = testResults[chatId];

    if (userData.state === 'ASK_SUBJECT') {
        userData.subject = callbackQuery.data;
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
    } else if (userData.state === 'ASK_PAYMENT') {
        userData.payment_method = callbackQuery.data;
        saveTestResults(testResults);

        // Foydalanuvchi ma'lumotlarini adminga yuborish
        bot.sendMessage(
            ADMIN_CHAT_ID,
            `📋 Yangi foydalanuvchi:\n\n🔤 Ism: ${userData.name}\n👤 Yosh: ${userData.age}\n📚 Yo'nalish: ${userData.subject}\n💰 To'lov usuli: ${userData.payment_method}`
        );

        if (callbackQuery.data === "offline") {
            bot.sendMessage(chatId, `✅ ${userData.name}, ma'lumotlaringiz saqlandi. Offline to'lovni amalga oshiring.`);
        } else {
            bot.sendMessage(chatId, `✅ ${userData.name},\nTo'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\n 💳 Karta: 9860 1201 1404 7869`);
        }

        const vercelUrl = `https://your-vercel-url.vercel.app/?user_id=${userData.id}`;
        bot.sendMessage(chatId, "📊 Test natijangizni quyidagi tugma orqali ko'rishingiz mumkin:", {
            reply_markup: {
                inline_keyboard: [[{ text: "📊 Test natijasini ko'rish", url: vercelUrl }]]
            }
        });
    }
});

// /save_result buyrug'i (faqat admin uchun)
bot.onText(/\/save_result (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    if (chatId.toString() !== ADMIN_CHAT_ID) {
        bot.sendMessage(chatId, "❌ Bu buyruqni faqat admin ishlatishi mumkin.");
        return;
    }

    const [userId, correct, wrong] = match[1].split(' ');

    if (!userId || isNaN(correct) || isNaN(wrong)) {
        bot.sendMessage(chatId, "❌ To'g'ri format: `/save_result <user_id> <correct> <wrong>`", { parse_mode: 'Markdown' });
        return;
    }

    if (!testResults[userId]) {
        bot.sendMessage(chatId, "❌ Foydalanuvchi ID topilmadi.");
        return;
    }

    testResults[userId].testResult = {
        correct: parseInt(correct),
        wrong: parseInt(wrong),
    };
    saveTestResults(testResults);

    bot.sendMessage(chatId, `✅ Test natijalari saqlandi.\n\nID: ${userId}\n✅ To'g'ri: ${correct}\n❌ Xato: ${wrong}`);
});
