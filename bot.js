const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Bot tokenini kiriting
const token = '7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg';
const bot = new TelegramBot(token, { polling: true });

// Bosqichlar uchun o'zgaruvchilar
const ASK_NAME = 'ASK_NAME';
const ASK_AGE = 'ASK_AGE';
const ASK_PHONE = 'ASK_PHONE';
const ASK_SUBJECT = 'ASK_SUBJECT';
const ASK_PAYMENT = 'ASK_PAYMENT';

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

// Foydalanuvchiga unikal raqamli ID berish
function generateUserId() {
    return Math.floor(Math.random() * 900000) + 100000;  // 6 raqamli tasodifiy ID yaratadi
}

// Ma'lumotlarni saqlash uchun test natijalari
let testResults = loadTestResults();

// /start buyrug'i
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    const userData = {};

    // Agar foydalanuvchi avval ro'yxatdan o'tgansiz bo'lsa
    if (testResults[chatId]) {
        const user = testResults[chatId];
        bot.sendMessage(chatId, `Siz ro'yxatdan o'tgansiz.\n\nID: ${user.id}\nIsm: ${user.name}\nYosh: ${user.age}\nTelefon: ${user.phone}\nFan yo'nalishi: ${user.subject}\nTo'lov usuli: ${user.payment_method}`);
    } else {
        // Yangi foydalanuvchi uchun ID yaratish
        userData.id = generateUserId();
        testResults[chatId] = userData;

        bot.sendMessage(chatId, "Ism va Familyangizni kiriting:");
        // Bosqichga o'tish uchun o'zgartirish kerak bo'ladi
        bot.once('message', (msg) => askName(msg, userData, chatId));
    }
});

function askName(msg, userData, chatId) {
    const name = msg.text;
    if (!/^[a-zA-Z ]+$/.test(name)) {
        bot.sendMessage(chatId, "Iltimos, faqat harflardan foydalaning.");
        return;
    }

    userData.name = name;

    bot.sendMessage(chatId, "Yoshingizni kiriting:");
    bot.once('message', (msg) => askAge(msg, userData, chatId));
}

function askAge(msg, userData, chatId) {
    userData.age = msg.text;
    bot.sendMessage(chatId, "Telefon raqamingizni yuboring:");
    bot.once('message', (msg) => askPhone(msg, userData, chatId));
}

function askPhone(msg, userData, chatId) {
    const phoneNumber = msg.text;
    if (!/^\d{9,}$/.test(phoneNumber)) {
        bot.sendMessage(chatId, "Iltimos, haqiqiy telefon raqamini kiriting:");
        // qaytib telefon raqami kiritilishini kutamiz
        return;
    }

    userData.phone = phoneNumber;

    // Fan yo'nalishlarini tanlash
    const subjects = [
        ["Matematika Fizika", "Matematika Ingliz tili"],
        ["Matematika Ona tili", "Kimyo Biologiya"],
        ["Ingliz tili Ona tili", "Xuquq Ingliz tili"],
        ["Tarix Geografiya", "Matematika Geografiya"],
        ["Ona tili Biologiya", "Tarix Ona tili"],
        ["PM maktablari", "Al Xorazmiy maktab"],
        ["Multilevel (Mock)", "IELTS (mock)"],
    ];

    const options = {
        reply_markup: {
            inline_keyboard: subjects.map(row => row.map(subject => ({
                text: subject,
                callback_data: subject
            })))
        }
    };

    bot.sendMessage(chatId, "Quyidagi yo'nalishlardan birini tanlang:", options);
    bot.once('callback_query', (callbackQuery) => askSubject(callbackQuery, userData, chatId));
}


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

function askPayment(callbackQuery, userData, chatId) {
    const paymentMethod = callbackQuery.data;
    userData.payment_method = paymentMethod;

    testResults[userData.id] = userData;
    saveTestResults(testResults);

    if (paymentMethod === "offline") {
        bot.editMessageText(
            `Hurmatli ${userData.name},\nMa'lumotlaringiz saqlandi. To'lovni offline amalga oshirishingiz mumkin.\nSizning ID: ${userData.id}`,
            { chat_id: chatId, message_id: callbackQuery.message.message_id }
        );
    } else {
        bot.editMessageText(
            `Hurmatli ${userData.name},\nTo'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\nKarta: 9860 1201 1404 7869\nEga: @Ozodbekmath_teacher\n\nSizning ID: ${userData.id}\nTo'lovni amalga oshirgach, adminga murojaat qiling!`,
            { chat_id: chatId, message_id: callbackQuery.message.message_id }
        );
    }

    // "Test natijasini ko'rish" tugmasini qo'shish
    const vercelUrl = `https://test-bot-livid.vercel.app/?user_id=${userData.id}`;
    const options = {
        reply_markup: {
            inline_keyboard: [[{ text: "Test natijasini ko'rish", url: vercelUrl }]]
        }
    };

    bot.sendMessage(chatId, "Test natijangizni quyidagi tugma orqali ko'rishingiz mumkin:", options);
}
