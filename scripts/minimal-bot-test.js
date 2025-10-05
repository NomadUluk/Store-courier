const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function startMinimalBot() {
  try {
    console.log('🤖 Запуск минимального тестового бота...')

    // Получаем токен
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'COURIER_BOT_TOKEN' }
    })

    if (!tokenSetting || !tokenSetting.value) {
      console.log('❌ Токен не найден')
      return
    }

    console.log(`✅ Токен найден: ${tokenSetting.value.slice(0, 10)}...`)

    // Создаем бота
    const bot = new TelegramBot(tokenSetting.value, { 
      polling: true 
    })

    console.log('🎉 Бот запущен! Ожидание сообщений...')

    // Логируем все входящие сообщения
    bot.on('message', (msg) => {
      console.log('📨 Получено сообщение:', {
        chat_id: msg.chat.id,
        text: msg.text,
        from: msg.from?.first_name,
        date: new Date(msg.date * 1000).toLocaleString()
      })
    })

    // Обработчик /start
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id
      console.log(`🚀 Команда /start от пользователя ${chatId}`)

      try {
        await bot.sendMessage(chatId, `👋 Привет! Бот работает!
        
Тестовое сообщение от ${new Date().toLocaleString()}`)
        console.log('✅ Ответ отправлен')
      } catch (error) {
        console.error('❌ Ошибка отправки:', error)
      }
    })

    // Обработчик ошибок
    bot.on('polling_error', (error) => {
      console.error('🔴 Ошибка polling:', error.message)
    })

    bot.on('error', (error) => {
      console.error('🔴 Общая ошибка:', error)
    })

  } catch (error) {
    console.error('❌ Ошибка запуска:', error)
  }
}

// Обработчик завершения
process.on('SIGINT', async () => {
  console.log('\n🛑 Остановка бота...')
  await prisma.$disconnect()
  process.exit(0)
})

startMinimalBot()
