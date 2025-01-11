const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Bot tokenini kiriting
const token = '7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg';
const bot = new TelegramBot(token, { polling: true });

// Test natijalarini saqlash uchun fayl nomi
const TEST_RESULTS_FILE = 'test_results.json';
const ADMIN = '@yusuf_1broo';

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
        bot.sendMessage(chatId, `Siz ro'yxatdan o'tgansiz.\n\n📋 ID: ${user.id}\n🔤 Ism: ${user.name || "Noma'lum"}\n👤 Yosh: ${user.age || "Noma'lum"}\n📞 Telefon: ${user.phone || "Noma'lum"}\n📚 Fan yo'nalishi: ${user.subject || "Noma'lum"}\n💰 To'lov usuli: ${user.payment_method || "Noma'lum"}`,{
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Bo't muallifi",
                            url: "https://t.me/admin_profile"  // Adminning Telegram username'ini qo'yishingiz kerak
                        }
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

// /testnatijasi buyrug'i
bot.onText(/\/testnatijasi/, (msg) => {
    const chatId = msg.chat.id;
    const user = testResults[chatId];

    if (!user) {
        bot.sendMessage(chatId, "❌ Siz ro'yxatdan o'tmagansiz. Iltimos, avval /start buyrug'ini bosing.");
        return;
    }

    if (user.result) {
        const { correct, incorrect } = user.result;
        bot.sendMessage(chatId, `📊 Sizning test natijalaringiz:\n✅ To'g'ri javoblar: ${correct}\n❌ Xato javoblar: ${incorrect}`);
    } else {
        bot.sendMessage(chatId, "📊 Sizning test natijangiz hali kiritilmagan. Iltimos, adminga murojaat qiling.");
    }
});

// Test natijasini admin tomonidan qo'shish
bot.onText(/\/settest (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    const args = match[1].split(" ");
    if (args.length !== 3) {
        bot.sendMessage(chatId, "❌ Noto'g'ri format. To'g'ri format:\n/settest <id> <to'g'ri javoblar soni> <xato javoblar soni>");
        return;
    }

    const [id, correct, incorrect] = args;
    const user = Object.values(testResults).find((user) => user.id.toString() === id);

    if (!user) {
        bot.sendMessage(chatId, `❌ ID ${id} topilmadi.`);
        return;
    }

    user.result = {
        correct: parseInt(correct, 10),
        incorrect: parseInt(incorrect, 10),
    };
    saveTestResults(testResults);

    bot.sendMessage(chatId, `✅ Test natijalari saqlandi:\n📋 ID: ${id}\n✅ To'g'ri javoblar: ${correct}\n❌ Xato javoblar: ${incorrect}`);
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
}

// Fan yo'nalishini so'rash
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userData = testResults[chatId];

    if (userData.state === 'ASK_SUBJECT') {
        const subject = callbackQuery.data;
        userData.subject = subject;
        userData.state = 'ASK_PAYMENT';
        saveTestResults(testResults);

        // Tugmalarni o'chirish
        bot.editMessageReplyMarkup(
            { inline_keyboard: [] },
            { chat_id: chatId, message_id: callbackQuery.message.message_id }
        ).then(() => {
            bot.sendMessage(chatId, `📚 Siz "${subject}" fan yo'nalishini tanladingiz.`);

            // To'lov usulini tanlash uchun tugmalar
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
        });
    } else if (userData.state === 'ASK_PAYMENT') {
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
                `✅ Hurmatli ${userData.name},\n💳 To'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\n💳 Karta: 9860 1201 1404 7869\n👨‍🏫 Ega: @Ozodbekmath_teacher\n\n📋 Sizning ID: ${userData.id}\nTo'lovni amalga oshirgach, adminga murojaat qiling!\n\n\n Bo't mualifi ${ADMIN}`
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
    }
});
