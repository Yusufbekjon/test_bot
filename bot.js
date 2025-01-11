const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Bot tokenini kiriting
const token = '7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg';
const bot = new TelegramBot(token, { polling: true });

// Test natijalarini saqlash uchun fayl nomi
const TEST_RESULTS_FILE = './test_results.json';

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
        bot.sendMessage(chatId, `Siz ro'yxatdan o'tgansiz.\n\n📋 ID: ${user.id}\n🔤 Ism: ${user.name || "Noma'lum"}\n👤 Yosh: ${user.age || "Noma'lum"}\n📞 Telefon: ${user.phone || "Noma'lum"}\n📚 Fan yo'nalishi: ${user.subject || "Noma'lum"}\n💰 To'lov usuli: ${user.payment_method || "Noma'lum"}\n\nBo't muallifi: @yusuf_1broo`);
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
