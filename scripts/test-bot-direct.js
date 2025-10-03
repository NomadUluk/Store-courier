const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBotDirect() {
  try {
    console.log('🤖 Тестирование Telegram бота напрямую...')

    // Получаем токен из базы данных
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'TELEGRAM_BOT_TOKEN' }
    })

    if (!tokenSetting || !tokenSetting.value) {
      console.log('❌ Токен бота не найден в базе данных')
      return
    }

    console.log('✅ Токен найден:', tokenSetting.value.slice(0, 10) + '...')

    // Создаем экземпляр бота
    const bot = new TelegramBot(tokenSetting.value, { polling: false })

    // Тестируем getMe
    console.log('📡 Проверяем соединение с Telegram API...')
    const botInfo = await bot.getMe()
    console.log('✅ Бот подключен:', botInfo.username)

    // Запускаем в режиме polling для тестирования
    console.log('🔄 Запускаем бота в режиме polling...')
    
    const pollingBot = new TelegramBot(tokenSetting.value, { 
      polling: {
        interval: 1000,
        autoStart: true
      }
    })

    // Обработчик команды /start
    pollingBot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id
      console.log(`📨 Получена команда /start от пользователя ${chatId}`)

      const welcomeMessage = `👋 Добро пожаловать в систему уведомлений для курьеров!

Для регистрации в системе, пожалуйста, поделитесь своим номером телефона, нажав кнопку ниже.

📱 Ваш номер телефона должен быть зарегистрирован в системе администратором.`

      const keyboard = {
        keyboard: [
          [
            {
              text: '📱 Поделиться номером телефона',
              request_contact: true
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }

      try {
        await pollingBot.sendMessage(chatId, welcomeMessage, {
          reply_markup: keyboard
        })
        console.log('✅ Приветственное сообщение отправлено')
      } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error)
      }
    })

    // Обработчик контактов
    pollingBot.on('contact', async (msg) => {
      const chatId = msg.chat.id
      const contact = msg.contact
      
      console.log(`📞 Получен контакт от пользователя ${chatId}:`, contact.phone_number)

      // Ищем курьера по номеру телефона
      const phoneNumber = contact.phone_number
      const normalizedPhone = phoneNumber.replace(/[\s\-\+\(\)]/g, '')
      
      const courier = await prisma.user.findFirst({
        where: {
          role: 'COURIER',
          OR: [
            { phoneNumber: phoneNumber },
            { phoneNumber: normalizedPhone },
            { phoneNumber: `+${normalizedPhone}` },
            { phoneNumber: `+996${normalizedPhone.slice(-9)}` },
          ]
        }
      })

      let responseMessage
      if (courier) {
        // Сохраняем chat_id курьера
        const currentChatIds = await prisma.setting.findUnique({
          where: { key: 'TELEGRAM_CHAT_ID' }
        })

        let chatIds = {}
        if (currentChatIds && currentChatIds.value) {
          try {
            chatIds = JSON.parse(currentChatIds.value)
          } catch (e) {
            chatIds = {}
          }
        }

        chatIds[courier.id] = chatId.toString()

        await prisma.setting.update({
          where: { key: 'TELEGRAM_CHAT_ID' },
          data: { value: JSON.stringify(chatIds) }
        })

        responseMessage = `✅ Добро пожаловать, ${courier.fullname}! Вы успешно зарегистрированы в системе уведомлений.`
        console.log(`✅ Курьер ${courier.fullname} зарегистрирован с chat_id: ${chatId}`)
      } else {
        responseMessage = `❌ Курьер с номером ${phoneNumber} не найден в системе. Обратитесь к администратору.`
        console.log(`❌ Курьер с номером ${phoneNumber} не найден`)
      }

      try {
        await pollingBot.sendMessage(chatId, responseMessage, {
          reply_markup: {
            remove_keyboard: true
          }
        })
      } catch (error) {
        console.error('❌ Ошибка отправки ответа:', error)
      }
    })

    console.log('🎉 Бот запущен и готов к работе!')
    console.log('💡 Теперь вы можете протестировать бота в Telegram:')
    console.log('   1. Найдите вашего бота')
    console.log('   2. Отправьте команду /start')
    console.log('   3. Поделитесь номером телефона')
    console.log('\n⏹️  Для остановки нажмите Ctrl+C')

  } catch (error) {
    console.error('❌ Ошибка:', error)
  }
}

// Обработчик завершения
process.on('SIGINT', async () => {
  console.log('\n🛑 Остановка бота...')
  await prisma.$disconnect()
  process.exit(0)
})

testBotDirect()
