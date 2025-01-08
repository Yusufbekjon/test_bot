# import json
# from telegram import Update
# from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes

# TEST_RESULTS_FILE = "test_results.json"

# # Test natijalarini yuklash
# def load_test_results():
#     try:
#         with open(TEST_RESULTS_FILE, "r") as f:
#             return json.load(f)
#     except FileNotFoundError:
#         return {}

# # Test natijasini saqlash
# def save_test_results(data):
#     with open(TEST_RESULTS_FILE, "w") as f:
#         json.dump(data, f, indent=4)

# # Test natijasini yangilash (Admin uchun)
# def update_test_result(user_id, correct, wrong):
#     test_results = load_test_results()
#     if user_id in test_results:
#         test_results[user_id]['correct'] = correct
#         test_results[user_id]['wrong'] = wrong
#         save_test_results(test_results)
#     else:
#         print(f"ID {user_id} topilmadi. Yangi ID qo'shish kerak.")

# # Test natijasini ko'rsatish
# async def show_test_result(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
#     user_id = update.message.text.strip()  # Foydalanuvchi yuborgan IDni olish
#     test_results = load_test_results()

#     # Foydalanuvchi ID bo'yicha natijalarni ko'rsatish
#     if user_id in test_results:
#         result = test_results[user_id]
#         await update.message.reply_text(
#             f"Test natijasi:\nTo'g'ri: {result['correct']}\nXato: {result['wrong']}"
#         )
#     else:
#         await update.message.reply_text("Bu ID bo'yicha ma'lumot topilmadi. IDni tekshiring.")

# # Admin tomonidan test natijasini yangilash
# async def update_test(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
#     # Admin ID tekshiruvi
#     ADMIN_ID = '5025075321'  # Admin ID ni o'zgartiring

#     if str(update.message.from_user.id) == ADMIN_ID:  # Faqat admin uchun
#         try:
#             # ID, to'g'ri va xato javoblarni admin yuboradi
#             user_id = context.args[0]  # ID
#             correct = int(context.args[1])  # To'g'ri javoblar soni
#             wrong = int(context.args[2])  # Xato javoblar soni

#             # Test natijasini yangilash
#             update_test_result(376867, 12, 10)
#             await update.message.reply_text(f"ID {user_id} bo'yicha natijalar yangilandi: To'g'ri: {correct}, Xato: {wrong}")
#         except (IndexError, ValueError):
#             await update.message.reply_text("Iltimos, ID, to'g'ri va xato javoblar sonini to'g'ri kiriting.")
#     else:
#         await update.message.reply_text("Sizning admin huquqingiz yo'q.")

# # Asosiy botni ishga tushirish
# if __name__ == "__main__":
#     TOKEN = "7503846179:AAGi3hpUYZebL-07KK72T--p3EH7vQ_RLwg"  # Tokenni bot tokeningiz bilan almashtiring
#     app = ApplicationBuilder().token(TOKEN).build()

#     # Foydalanuvchi ID'sini yuborganida test natijasini ko'rsatish
#     app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, show_test_result))

#     # Admin tomonidan test natijasini yangilash uchun handler
#     app.add_handler(MessageHandler(filters.TEXT & filters.COMMAND, update_test))

#     print("Bot ishga tushdi...")
#     app.run_polling()
