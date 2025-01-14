const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');
const app = express();

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

    if (testResults[chatId]) {
        const user = testResults[chatId];
        bot.sendMessage(chatId, `Siz ro'yxatdan o'tgansiz.\n\n📋 ID: ${user.id}\n🔤 Ism: ${user.name || "Noma'lum"}\n👤 Yosh: ${user.age || "Noma'lum"}\n📚 Yo'nalish: ${user.subject || "Noma'lum"}\n💰 To'lov turi: ${user.payment_method || "Noma'lum"}`);
    } else {
        testResults[chatId] = { id: generateUserId(), state: 'ASK_NAME' };
        saveTestResults(testResults);
        bot.sendMessage(chatId, "🔤 Ism va Familyangizni kiriting:");
    }
});

// Xabarlarni qayta ishlash
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (!testResults[chatId]) return;

    const userData = testResults[chatId];

    switch (userData.state) {
        case 'ASK_NAME':
            userData.name = msg.text;
            userData.state = 'ASK_AGE';
            saveTestResults(testResults);
            bot.sendMessage(chatId, "👤 Yoshingizni kiriting:");
            break;
        case 'ASK_AGE':
            userData.age = parseInt(msg.text, 10);
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
            bot.sendMessage(chatId, "📚 Yo'nalishni tanlang:", {
                reply_markup: {
                    inline_keyboard: subjects.map(row => row.map(subject => ({ text: subject, callback_data: subject })))
                }
            });
            break;
    }
});

// Callback querylar
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userData = testResults[chatId];

    if (userData.state === 'ASK_SUBJECT') {
        userData.subject = callbackQuery.data;
        userData.state = 'ASK_PAYMENT';
        saveTestResults(testResults);

        bot.sendMessage(chatId, "💰 To'lov usulini tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💵 Offline", callback_data: "offline" }, { text: "💳 Online", callback_data: "online" }]
                ]
            }
        });
    } else if (userData.state === 'ASK_PAYMENT') {
        userData.payment_method = callbackQuery.data;
        saveTestResults(testResults);

        bot.sendMessage(ADMIN_CHAT_ID, `📋 Yangi foydalanuvchi:\n\n🔤 Ism: ${userData.name}\n👤 Yosh: ${userData.age}\n📚 Yo'nalish: ${userData.subject}\n💰 To'lov turi: ${userData.payment_method}\n📋 ID: ${userData.id}`);
        bot.sendMessage(chatId, `✅ Ro'yxatdan o'tish yakunlandi! ID: ${userData.id}`);
    }
});

// Admin test natijalarini kiritish
bot.onText(/\/save_result (.+)/, (msg, match) => {
    const chatId = msg.chat.id;

    if (chatId.toString() !== ADMIN_CHAT_ID) {
        bot.sendMessage(chatId, "❌ Bu buyruqni faqat admin ishlatishi mumkin.");
        return;
    }

    const [userId, correct, wrong] = match[1].split(' ');

    if (!userId || isNaN(correct) || isNaN(wrong)) {
        bot.sendMessage(chatId, "❌ To'g'ri format: `/save_result <user_id> <correct> <wrong>`");
        return;
    }

    const user = Object.values(testResults).find(u => u.id.toString() === userId);
    if (!user) {
        bot.sendMessage(chatId, "❌ Foydalanuvchi topilmadi.");
        return;
    }

    user.testResult = { correct: parseInt(correct), wrong: parseInt(wrong) };
    saveTestResults(testResults);

    bot.sendMessage(chatId, `✅ Test natijalari saqlandi: ID: ${userId}, To'g'ri: ${correct}, Xato: ${wrong}`);
});

// Express serverini ishga tushurish
app.use(express.static('public'));

// API endpoint
app.get('/api/result', (req, res) => {
    const userId = req.query.user_id;  // URL'dan 'user_id' parametrini olish
    if (userId) {
        const user = Object.values(testResults).find(u => u.id.toString() === userId);
        if (user && user.testResult) {
            res.json({ success: true, correct: user.testResult.correct, wrong: user.testResult.wrong });
        } else {
            res.json({ success: false });
        }
    } else {
        res.json({ success: false });
    }
});

// Serverni ishga tushurish
app.listen(3000, () => {
    console.log("Server 3000 portda ishga tushdi...");
});
