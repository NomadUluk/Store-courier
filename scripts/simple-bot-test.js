const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function startBot() {
  try {
    console.log('🤖 Запуск простого тестового бота...')

    // Получаем токен из базы данных
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'COURIER_BOT_TOKEN' }
    })

    if (!tokenSetting || !tokenSetting.value) {
      console.log('❌ Токен бота не найден')
      return
    }

    console.log('✅ Токен найден, запускаем бота...')

    // Создаем бота с polling
    const bot = new TelegramBot(tokenSetting.value, { 
      polling: true 
    })

    console.log('🎉 Бот запущен! Теперь можете тестировать:')
    console.log('1. Найдите бота @storecourier_bot в Telegram')
    console.log('2. Отправьте команду /start')
    console.log('3. Поделитесь номером телефона')
    console.log('\n⏹️  Для остановки нажмите Ctrl+C')

    // Обработчик /start
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id
      console.log(`📨 /start от пользователя ${chatId} (${msg.from?.first_name})`)

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

      await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard
      })
    })

    // Обработчик контактов
    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id
      const contact = msg.contact
      
      console.log(`📞 Контакт от ${chatId}: ${contact.phone_number}`)

      // Ищем курьера
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
        // Получаем текущие chat_id
        const currentSetting = await prisma.setting.findUnique({
          where: { key: 'COURIER_CHAT_ID' }
        })

        let chatIds = {}
        if (currentSetting && currentSetting.value) {
          try {
            chatIds = JSON.parse(currentSetting.value)
          } catch (e) {
            console.log('Ошибка парсинга JSON, создаем новый объект')
            chatIds = {}
          }
        }

        // Добавляем новый courierID:chatID
        chatIds[courier.id] = chatId.toString()

        // Сохраняем обратно
        await prisma.setting.upsert({
          where: { key: 'COURIER_CHAT_ID' },
          update: { value: JSON.stringify(chatIds) },
          create: { key: 'COURIER_CHAT_ID', value: JSON.stringify(chatIds) }
        })

        responseMessage = `✅ Добро пожаловать, ${courier.fullname}! 

Вы успешно зарегистрированы в системе уведомлений.
CourierID: ${courier.id}
ChatID: ${chatId}

Теперь вы будете получать уведомления о новых заказах.`

        console.log(`✅ Курьер зарегистрирован:`)
        console.log(`   - Имя: ${courier.fullname}`)
        console.log(`   - CourierID: ${courier.id}`)
        console.log(`   - ChatID: ${chatId}`)
        console.log(`   - Телефон: ${phoneNumber}`)
      } else {
        responseMessage = `❌ Курьер с номером ${phoneNumber} не найден в системе. 

Обратитесь к администратору для добавления в систему.`
        console.log(`❌ Курьер с номером ${phoneNumber} не найден`)
      }

      await bot.sendMessage(chatId, responseMessage, {
        reply_markup: {
          remove_keyboard: true
        }
      })
    })

    // Обработчик ошибок
    bot.on('polling_error', (error) => {
      console.error('Ошибка polling:', error)
    })

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

startBot()
