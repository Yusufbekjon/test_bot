from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    ApplicationBuilder, CommandHandler, MessageHandler,
    CallbackQueryHandler, ContextTypes, ConversationHandler, filters
)
import random
import json

# Bosqichlar uchun o'zgaruvchilar
ASK_NAME, ASK_AGE, ASK_PHONE, ASK_SUBJECT, ASK_PAYMENT = range(5)

# Test natijalarini saqlash uchun fayl nomi
TEST_RESULTS_FILE = "test_results.json"

# Test natijalarini yuklash
def load_test_results():
    try:
        with open(TEST_RESULTS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

# Test natijalarini saqlash
def save_test_results(data):
    with open(TEST_RESULTS_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Foydalanuvchiga unikal raqamli ID berish
def generate_user_id():
    return str(random.randint(100000, 999999))  # 6 raqamli tasodifiy ID yaratadi

# Foydalanuvchi ma'lumotlarini boshqarish
test_results = load_test_results()

# /start buyrug'i
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_data = context.user_data

    if 'id' in user_data:  # Ro'yxatdan o'tganligini tekshirish
        await update.message.reply_text(
            f"Siz ro'yxatdan o'tgansiz.\n\n"
            f"ID: {user_data['id']}\n"
            f"Ism: {user_data['name']}\n"
            f"Yosh: {user_data['age']}\n"
            f"Telefon: {user_data['phone']}\n"
            f"Fan yo'nalishi: {user_data['subject']}\n"
            f"To'lov usuli: {user_data['payment_method']}"
        )
        return ConversationHandler.END
    else:
        # Agar ID yo'q bo'lsa, yangi ID yarating
        user_data['id'] = generate_user_id()  # ID faqat birinchi ro'yxatdan o'tishda yaratiladi
        await update.message.reply_text("Ism Familyanigizni kiriting:")
        return ASK_NAME

# Ismni qabul qilish
async def ask_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    name = update.message.text
    if not name.replace(" ", "").isalpha():
        await update.message.reply_text("Iltimos, faqat harflardan foydalaning. Raqamlardan foydalanmang.")
        return ASK_NAME
    context.user_data['name'] = name
    await update.message.reply_text("Yoshingizni kiriting:")
    return ASK_AGE

# Yoshni qabul qilish
async def ask_age(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['age'] = update.message.text
    await update.message.reply_text("Telefon raqamingizni yuboring:")
    return ASK_PHONE

# Telefon raqamini qabul qilish
async def ask_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['phone'] = update.message.contact.phone_number if update.message.contact else update.message.text

    # Fan yo'nalishlari uchun tugmalar
    subjects = [
        ["Matematika Fizika", "Matematika Ingliz tili"],
        ["Matematika Ona tili", "Kimyo Biologiya"],
        ["Ingliz tili Ona tili", "Xuquq Ingliz tili"],
        ["Tarix Geografiya", "Matematika Geografiya"],
        ["Ona tili Biologiya", "Tarix Ona tili"],
        ["PM maktablari", "Al Xorazmiy maktab"],
        ["Multilevel (Mock)", "IELTS (mock)"],
    ]
    keyboard = [[InlineKeyboardButton(subject, callback_data=subject) for subject in row] for row in subjects]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text("Quyidagi yo'nalishlardan birini tanlang:", reply_markup=reply_markup)
    return ASK_SUBJECT

# Fan yo'nalishini qabul qilish
async def ask_subject(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data['subject'] = query.data

    # To'lov usuli tugmalari
    payment_keyboard = [
        [InlineKeyboardButton("\ud83d\udcb5 Offline", callback_data="offline"), InlineKeyboardButton("\ud83d\udcb3 Online", callback_data="online")]
    ]
    reply_markup = InlineKeyboardMarkup(payment_keyboard)

    await query.edit_message_text("To'lov usulini tanlang:", reply_markup=reply_markup)
    return ASK_PAYMENT

# To'lov usulini qabul qilish
async def ask_payment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    payment_method = query.data
    context.user_data['payment_method'] = payment_method

    user_id = context.user_data['id']
    test_results[user_id] = {
        "name": context.user_data['name'],
        "age": context.user_data['age'],
        "phone": context.user_data['phone'],
        "subject": context.user_data['subject'],
        "payment_method": context.user_data['payment_method'],
        "correct": 0,
        "wrong": 0
    }
    save_test_results(test_results)

    if payment_method == "offline":
        await query.edit_message_text(
            f"Hurmatli {context.user_data['name']},\nMa'lumotlaringiz saqlandi. To'lovni offline amalga oshirishingiz mumkin.\n"
            f"Sizning ID: {user_id}"
        )
    else:
        await query.edit_message_text(
            f"Hurmatli {context.user_data['name']},\nTo'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\n"
            f"Karta: 9860 1201 1404 7869\nEga: @Ozodbekmath_teacher\n\n"
            f"Sizning ID: {user_id}\n"
            f"To'lovni amalga oshirgach, adminga murojaat qiling!"
        )

    return ConversationHandler.END

# Test natijasini ko'rsatish
async def show_test_result(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.message.text.strip()
    if user_id in test_results:
        result = test_results[user_id]
        await update.message.reply_text(
            f"Test natijasi:\nTo'g'ri: {result['correct']}\nXato: {result['wrong']}"
        )
    else:
        await update.message.reply_text("Bu ID bo'yicha ma'lumot topilmadi. IDni tekshiring.")

# Asosiy botni ishga tushirish
if __name__ == "__main__":
    TOKEN = "7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg"  # Bot tokenini kiriting
    app = ApplicationBuilder().token(TOKEN).build()

    # Handlerlarni qo'shish
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            ASK_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_name)],
            ASK_AGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_age)],
            ASK_PHONE: [MessageHandler(filters.CONTACT | filters.TEXT & ~filters.COMMAND, ask_phone)],
            ASK_SUBJECT: [CallbackQueryHandler(ask_subject)],
            ASK_PAYMENT: [CallbackQueryHandler(ask_payment)],
        },
        fallbacks=[CommandHandler("cancel", lambda u, c: ConversationHandler.END)],
    )

    # Test natijasi uchun handler
    app.add_handler(conv_handler)
    print("Bot ishga tushdi...")
    app.run_polling()
