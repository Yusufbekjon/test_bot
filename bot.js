const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Bot tokenini kiriting
const token = '7963584828:AAGt1rhNXafuzjMcuUUmQcBw86AFu3tV6d4';
const bot = new TelegramBot(token, { polling: true });

// Adminning chat ID'sini kiriting
const ADMIN_CHAT_ID = '5025075321';

// Fayl nomlari
const TEST_RESULTS_FILE = 'test_results.json';
const TESTS_FILE = 'tests.json';

// Fayllarni yuklash funksiyalari
function loadFromFile(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    } catch (e) {
        return {};
    }
}

function saveToFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error(`❌ Faylga yozishda xatolik (${filename}):`, error);
    }
}

// Ma'lumotlarni yuklash
let testResults = loadFromFile(TEST_RESULTS_FILE);
let tests = loadFromFile(TESTS_FILE);

// Foydalanuvchilar uchun unikal ID yaratish
function generateUserId() {
    return Math.floor(Math.random() * 900000) + 100000;
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Foydalanuvchini tekshirish
    if (testResults[chatId]) {
        const user = testResults[chatId];
        bot.sendMessage(chatId, `📋 Siz ro'yxatdan o'tgansiz:\n\n🔤 Ism: ${user.name || "Noma'lum"}\n👤 Yosh: ${user.age || "Noma'lum"}\n📞 Telefon: ${user.phone || "Noma'lum"}\n📚 Yo'nalish: ${user.subject || "Noma'lum"}`);
    } else {
        testResults[chatId] = { id: generateUserId(), state: 'ASK_NAME' };
        saveToFile(TEST_RESULTS_FILE, testResults);

        bot.sendMessage(chatId, "🔤 Iltimos, ismingizni kiriting:");
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userData = testResults[chatId];

    if (!userData || !userData.state) return;

    switch (userData.state) {
        case 'ASK_NAME':
            userData.name = msg.text;
            userData.state = 'ASK_AGE';
            bot.sendMessage(chatId, "👤 Yoshingizni kiriting:");
            break;

        case 'ASK_AGE':
            const age = parseInt(msg.text, 10);
            if (isNaN(age) || age <= 0 || age > 100) {
                bot.sendMessage(chatId, "❌ Iltimos, to'g'ri yosh kiriting.");
            } else {
                userData.age = age;
                userData.state = 'ASK_PHONE';
                bot.sendMessage(chatId, "📞 Telefon raqamingizni kiriting:");
            }
            break;

        case 'ASK_PHONE':
            userData.phone = msg.text;
            userData.state = 'ASK_SUBJECT';
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
                    keyboard: subjects,
                    resize_keyboard: true
                }
            });
            break;

        case 'ASK_SUBJECT':
            userData.subject = msg.text;
            userData.state = null;
            bot.sendMessage(chatId, `✅ Ma'lumotlaringiz saqlandi!`);
            saveToFile(TEST_RESULTS_FILE, testResults);
            break;
    }
});

// Payment options
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

bot.on('callback_query', (query) => {
    const userId = query.from.id; // Foydalanuvchi ID
    if (query.data === 'online') {
        bot.sendMessage(userId, `✅ Hurmatli ${query.from.first_name},\nTo'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\n💳 Karta: 9860 1201 1404 7869\n👨‍🏫 Ega: @Ozodbekmath_teacher\n📋 Sizning ID: ${userId}`);
    } else if (query.data === 'offline') {
        bot.sendMessage(userId, `Siz ofline to'lov qilishingiz mumkin.`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Bot Admini", callback_data: "admin_profile" }]
                ]
            }
        });
    } else if (query.data === 'admin_profile') {
        // Adminni profiliga o'tish
        bot.sendMessage(userId, `Bot adminiga o'tish: @admin_nick`, { parse_mode: 'Markdown' });
    }
});

// Admin funksiyalari
bot.onText(/\/addresult/, (msg) => {
    if (msg.chat.id != ADMIN_CHAT_ID) {
        bot.sendMessage(msg.chat.id, "❌ Sizda bu amalni bajarish huquqi yo'q.");
        return;
    }

    bot.sendMessage(msg.chat.id, "Foydalanuvchi ID va javoblarni kiriting (masalan, 658945: 1-a, 2-b, 3-c).");
    bot.once('message', (msg) => {
        const [id, result] = msg.text.split(':');
        if (!testResults[id]) {
            bot.sendMessage(msg.chat.id, "❌ ID topilmadi.");
            return;
        }

        testResults[id].result = result.trim();
        saveToFile(TEST_RESULTS_FILE, testResults);
        bot.sendMessage(msg.chat.id, `✅ Natija saqlandi!`);
    });
});

// Test natijalarini tekshirish
bot.onText(/\/myresult/, (msg) => {
    bot.sendMessage(msg.chat.id, "ID raqamingizni kiriting:");
    bot.once('message', (msg) => {
        const id = msg.text;
        if (!testResults[id] || !testResults[id].result) {
            bot.sendMessage(msg.chat.id, "❌ Natija topilmadi.");
            return;
        }

        const result = testResults[id].result;
        bot.sendMessage(msg.chat.id, `✅ Sizning natijangiz:\n\n${result}`);
    });
});

// Menu va tugmalar
bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "Quyidagilarni tanlang:", {
        reply_markup: {
            keyboard: [
                ["📋 Natijani Tekshirish"], ["📑 Test Kiritish"],
                ["🔙 Bosh menyu"]
            ],
            resize_keyboard: true
        }
    });
});
