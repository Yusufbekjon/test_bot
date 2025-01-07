from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    ApplicationBuilder, CommandHandler, MessageHandler,
    CallbackQueryHandler, ContextTypes, ConversationHandler, filters
)

# Bosqichlar uchun o'zgaruvchilar
ASK_NAME, ASK_AGE, ASK_PHONE, ASK_SUBJECT, ASK_PAYMENT = range(5)

# /start buyrug'i
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    if 'name' in context.user_data:  # Ro'yxatdan o'tganligini tekshirish
        user_data = context.user_data
        await update.message.reply_text(
            f"Siz ro'yxatdan o'tgansiz.\n\n"
            f"Ism: {user_data['name']}\n"
            f"Yosh: {user_data['age']}\n"
            f"Telefon: {user_data['phone']}\n"
            f"Fan yo'nalishi: {user_data['subject']}\n"
            f"To'lov usuli: {user_data['payment_method']}"
        )
        return ConversationHandler.END
    else:
        await update.message.reply_text("Ism Familyanigizni kiriting:")
        return ASK_NAME

# Ismni qabul qilish
async def ask_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    name = update.message.text
    if not name.replace(" ", "").isalpha():
        await update.message.reply_text("✍️Iltimos, faqat harflardan foydalaning. Raqamlardan foydalanmang.")
        return ASK_NAME
    context.user_data['name'] = name
    await update.message.reply_text("✍️Yoshingizni kiriting:")
    return ASK_AGE

# Yoshni qabul qilish
async def ask_age(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['age'] = update.message.text
    await update.message.reply_text("📞Telefon raqamingizni yuboring:")
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
        [InlineKeyboardButton("💵 Offline", callback_data="offline"), InlineKeyboardButton("💳 Online", callback_data="online")]
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

    if payment_method == "offline":
        await query.edit_message_text(
            f"Hurmatli {context.user_data['name']},\nMa'lumotlaringiz saqlandi. To'lovni offline amalga oshirishingiz mumkin."
        )
    else:
        await query.edit_message_text(
            f"Hurmatli {context.user_data['name']},\nTo'lovni amalga oshirish uchun quyidagi ma'lumotlardan foydalaning:\n\n"
            f"Karta: 9860 1201 1404 7869\nEga: @Ozodbekmath_teacher\n\nTo'lovni amalga oshirgach, adminga murojaat qiling!"
        )
        await admin_notify(update, context)

    return ConversationHandler.END

# Adminga foydalanuvchi haqida ma'lumot yuborish
async def admin_notify(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    admin_chat_id = "5424737524"  # Admin chat ID

    user_data = context.user_data
    user_info = (
        f"Foydalanuvchi ma'lumoti:\n"
        f"Ismi: {user_data['name']}\n"
        f"Yoshi: {user_data['age']}\n"
        f"Telefon: {user_data['phone']}\n"
        f"Fan yo'nalishi: {user_data['subject']}\n"
        f"To'lov usuli: {user_data['payment_method']}"
    )

    decision_keyboard = [
        [InlineKeyboardButton("Tasdiqlash", callback_data="approve"), InlineKeyboardButton("Rad etish", callback_data="reject")]
    ]
    reply_markup = InlineKeyboardMarkup(decision_keyboard)

    await context.bot.send_message(chat_id=admin_chat_id, text=user_info, reply_markup=reply_markup)

# Adminning tasdiqlash yoki rad etish jarayoni
async def admin_decision(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    if query.data == "approve":
        await query.edit_message_text("Siz ro'yhatdan muvaffaqiyatli o'tingiz")
    elif query.data == "reject":
        await query.edit_message_text("Foydalanuvchi rad etildi. To'lov amalga oshirilmagan.")

# Ro'yxatdan o'tishni bekor qilish
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Ro'yxatdan o'tish bekor qilindi.")
    return ConversationHandler.END

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
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    # Admin qarori uchun handler
    app.add_handler(CallbackQueryHandler(admin_decision, pattern="^(approve|reject)$"))

    app.add_handler(conv_handler)

    print("Bot ishga tushdi...")
    app.run_polling()
