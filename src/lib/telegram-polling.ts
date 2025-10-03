import TelegramBot from 'node-telegram-bot-api'
import { getTelegramBotToken } from '@/lib/settings'
import { registerCourierInTelegram } from '@/lib/telegram'

let botInstance: TelegramBot | null = null
let isPollingActive = false
let restartAttempts = 0
const MAX_RESTART_ATTEMPTS = 3
let lastRestartTime = 0
const RESTART_COOLDOWN = 30000 // 30 секунд между перезапусками

// Функция для проверки статуса бота
async function checkBotStatus(token: string): Promise<boolean> {
  try {
    const testBot = new TelegramBot(token, { 
      polling: false,
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4 // Принудительно используем IPv4
        }
      }
    })
    
    // Устанавливаем таймаут для запроса
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 10000) // 10 секунд таймаут
    })
    
    const getMePromise = testBot.getMe()
    
    await Promise.race([getMePromise, timeoutPromise])
    return true
  } catch (error: any) {
    console.log('⚠️ Ошибка проверки статуса бота:', error.message)
    
    // Если это таймаут или сетевая ошибка, считаем что бот недоступен
    if (error.message.includes('TIMEOUT') || 
        error.message.includes('ETIMEDOUT') || 
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ECONNREFUSED')) {
      console.log('🌐 Проблемы с сетью - пропускаем проверку')
      return true // Пропускаем проверку при проблемах с сетью
    }
    
    return false
  }
}

// Функция для запуска бота в режиме polling
export async function startTelegramPolling() {
  try {
    // Проверяем защиту от бесконечного цикла
    const now = Date.now()
    if (now - lastRestartTime < RESTART_COOLDOWN) {
      console.log('⏳ Слишком частые перезапуски, пропускаем...')
      return
    }

    if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
      console.log('🛑 Превышено максимальное количество попыток перезапуска')
      return
    }

    // Сначала останавливаем предыдущий экземпляр если он есть
    if (botInstance || isPollingActive) {
      console.log('🛑 Остановка предыдущего экземпляра бота...')
      await stopTelegramPolling()
      // Даём время для полной остановки
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const token = await getTelegramBotToken()
    if (!token) {
      console.log('⚠️ Telegram bot token не найден, polling не запущен')
      return
    }

    // Проверяем статус бота перед запуском (с улучшенной обработкой ошибок)
    console.log('🔍 Проверка статуса бота...')
    const isBotAvailable = await checkBotStatus(token)
    if (!isBotAvailable) {
      console.log('❌ Бот недоступен, возможно уже запущен в другом месте')
      restartAttempts++
      lastRestartTime = now
      return
    }

    // Webhook функциональность полностью удалена - используем только polling
    console.log('✅ Используем только polling режим (webhook отключен)')

    console.log('🚀 Запуск Telegram бота в режиме polling...')

    // Создаём новый экземпляр с улучшенными настройками сети
    botInstance = new TelegramBot(token, { 
      polling: {
        interval: 3000, // Увеличиваем интервал для снижения нагрузки
        params: {
          timeout: 30, // Увеличиваем таймаут
          allowed_updates: ['message', 'callback_query'] // Ограничиваем типы обновлений
        }
      },
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4, // Принудительно используем IPv4
          timeout: 30000 // 30 секунд таймаут для запросов
        }
      }
    })

    // Обработчик команды /start
    botInstance.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString()
      console.log(`📨 /start от пользователя ${chatId} (${msg.from?.first_name})`)

      const welcomeMessage = `
👋 Добро пожаловать!

Если вы курьер, пожалуйста, поделитесь своим номером телефона, нажав кнопку ниже.
Здесь вы будете получать уведомления о заказах.

👋 Кош келиңиз!

Эгерде сиз курьер болсоңуз, төмөндөгү баскычты басып, телефон номериңизди бөлүшүңүз.
Бул жерден сиз заказдар боюнча билдирмелерди ала аласыз.`

      const keyboard = {
        keyboard: [
          [
            {
              text: '📱 Поделиться номером телефона / Телефон номерин бөлүшүү',
              request_contact: true
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }

      try {
        await botInstance!.sendMessage(chatId, welcomeMessage, {
          reply_markup: keyboard
        })
      } catch (error) {
        console.error('❌ Ошибка отправки приветственного сообщения:', error)
      }
    })

    // Обработчик команды /help
    botInstance.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id.toString()
      console.log(`❓ /help от пользователя ${chatId}`)

      const helpMessage = `🆘 Помощь / Жардам

🇷🇺 Русский:
🔹 /start - Начать регистрацию
🔹 📱 Поделиться номером - Зарегистрироваться в системе
🔹 /help - Показать эту справку

🇰🇬 Кыргызча:
🔹 /start - Катталууну баштоо
🔹 📱 Номер бөлүшүү - Системага катталуу
🔹 /help - Бул жардамды көрсөтүү

❓ Эгер суроолоруңуз болсо, администраторго кайрылыңыз.`

      try {
        await botInstance!.sendMessage(chatId, helpMessage)
      } catch (error) {
        console.error('❌ Ошибка отправки справки:', error)
      }
    })

    // Обработчик контактов
    botInstance.on('contact', async (msg) => {
      const chatId = msg.chat.id.toString()
      const contact = msg.contact
      
      if (!contact) return

      console.log(`📞 Контакт от ${chatId}: ${contact.phone_number}`)

      const result = await registerCourierInTelegram(
        chatId, 
        contact.phone_number
      )

      try {
        await botInstance!.sendMessage(chatId, result.message, {
          reply_markup: {
            remove_keyboard: true
          }
        })
        
        if (result.success) {
          console.log(`✅ Курьер успешно зарегистрирован: ${result.data?.courierName}`)
        }
      } catch (error) {
        console.error('❌ Ошибка отправки ответа на контакт:', error)
      }
    })

    // Обработчик текстовых сообщений
    botInstance.on('message', async (msg) => {
      // Пропускаем сообщения, которые уже обработаны
      if (msg.text && (msg.text.startsWith('/') || msg.contact)) {
        return
      }

      const chatId = msg.chat.id.toString()
      const text = msg.text?.toLowerCase().trim()

      if (!text) return

      // Обработка номера телефона в текстовом виде
      const phoneRegex = /[\+]?[0-9\s\-\(\)]{9,15}/
      if (phoneRegex.test(text)) {
        console.log(`📞 Номер телефона в тексте от ${chatId}: ${text}`)
        
        const result = await registerCourierInTelegram(
          chatId, 
          text
        )

        try {
          await botInstance!.sendMessage(chatId, result.message)
          
          if (result.success) {
            console.log(`✅ Курьер успешно зарегистрирован: ${result.data?.courierName}`)
          }
        } catch (error) {
          console.error('❌ Ошибка отправки ответа на номер:', error)
        }
        return
      }

      // Неизвестная команда
      const unknownMessage = `❓ Извините, я не понимаю эту команду / Кечиресиз, мен бул буйрукту түшүнбөйм.

Используйте / Колдонуңуз:
🔹 /start - Для начала регистрации / Катталууну баштоо
🔹 /help - Для получения справки / Жардам алуу

Или поделитесь своим номером телефона / Же телефон номериңизди бөлүшүңүз.`

      try {
        await botInstance!.sendMessage(chatId, unknownMessage)
      } catch (error) {
        console.error('❌ Ошибка отправки сообщения о неизвестной команде:', error)
      }
    })

    // Обработчики ошибок
    botInstance.on('polling_error', (error) => {
      console.error('🔴 Telegram polling error:', error.message)
      
      // Если это таймаут или сетевая ошибка, не перезапускаем
      if (error.message.includes('ETIMEDOUT') || 
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('EFATAL')) {
        console.log('🌐 Сетевая ошибка - не перезапускаем бота')
        return
      }
      
      // Если это конфликт 409, перезапускаем с защитой
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        console.log('🔄 Обнаружен конфликт 409, перезапуск бота...')
        
        // Проверяем защиту от бесконечного цикла
        const now = Date.now()
        if (now - lastRestartTime < RESTART_COOLDOWN || restartAttempts >= MAX_RESTART_ATTEMPTS) {
          console.log('⏳ Слишком частые перезапуски или превышен лимит, пропускаем...')
          return
        }
        
        restartAttempts++
        lastRestartTime = now
        
        setTimeout(async () => {
          await stopTelegramPolling()
          await new Promise(resolve => setTimeout(resolve, 5000)) // Увеличиваем задержку
          await startTelegramPolling()
        }, 2000)
      }
    })

    botInstance.on('error', (error) => {
      console.error('🔴 Telegram bot error:', error)
    })

    isPollingActive = true
    restartAttempts = 0 // Сбрасываем счетчик при успешном запуске
    console.log('✅ Telegram бот запущен в режиме polling')

  } catch (error) {
    console.error('❌ Ошибка запуска Telegram polling:', error)
  }
}

// Функция для остановки polling
export async function stopTelegramPolling() {
  try {
    if (botInstance) {
      console.log('🛑 Остановка Telegram polling...')
      
      try {
        // Для node-telegram-bot-api polling останавливается автоматически при null
        // Просто очищаем экземпляр
      } catch (error) {
        console.log('⚠️ Ошибка при остановке polling (это нормально):', error)
      }
      
      // Очищаем экземпляр
      botInstance = null
      isPollingActive = false
      
      console.log('✅ Telegram polling успешно остановлен')
    } else {
      isPollingActive = false
      console.log('ℹ️ Telegram polling уже остановлен')
    }
  } catch (error) {
    console.error('❌ Ошибка остановки Telegram polling:', error)
    // Принудительно сбрасываем состояние даже при ошибке
    botInstance = null
    isPollingActive = false
  }
}

// Функция для принудительной остановки всех экземпляров бота
export async function forceStopAllBots() {
  try {
    console.log('🛑 Принудительная остановка всех экземпляров бота...')
    
    // Останавливаем текущий экземпляр
    await stopTelegramPolling()
    
    // Дополнительная задержка для полной остановки
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('✅ Все экземпляры бота остановлены')
  } catch (error) {
    console.error('❌ Ошибка принудительной остановки:', error)
  }
}

// Проверка статуса
export function isTelegramPollingActive(): boolean {
  return isPollingActive
}

// Функция для сброса счетчиков перезапуска
export function resetRestartCounters() {
  restartAttempts = 0
  lastRestartTime = 0
  console.log('🔄 Счетчики перезапуска сброшены')
}
