import TelegramBot from 'node-telegram-bot-api'
import type { OrderWithDetails } from '@/types'

// Инициализация бота с таймаутом
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: false,
  request: {
    timeout: 5000 // 5 секунд таймаут
  }
})

// Функция для проверки длины сообщения
function checkMessageLength(message: string, keyboard?: any): boolean {
  const messageLength = message.length
  const keyboardLength = keyboard ? JSON.stringify(keyboard).length : 0
  const totalLength = messageLength + keyboardLength
  
  console.log(`Telegram: Длина сообщения: ${messageLength} символов`)
  console.log(`Telegram: Длина клавиатуры: ${keyboardLength} символов`)
  console.log(`Telegram: Общая длина: ${totalLength} символов`)
  
  if (totalLength > 4096) {
    console.warn('⚠️ Telegram: Превышен лимит 4096 символов!')
    return false
  }
  
  return true
}

// Функция для отправки уведомления о новом заказе
export async function sendNewOrderNotification(order: OrderWithDetails) {
  try {
    console.log('Telegram: Начинаем отправку уведомления о новом заказе:', order.id)
    const chatId = process.env.TELEGRAM_CHAT_ID!
    
    console.log('Telegram: Chat ID:', chatId)
    console.log('Telegram: Bot Token настроен:', !!process.env.TELEGRAM_BOT_TOKEN)
    
    // Формируем сообщение
    const message = `🆕 *Новый заказ!*
    
📋 *Заказ #${order.id.slice(-8)}*
📍 *Адрес:* ${order.deliveryAddress}
💰 *Сумма:* ${order.orderItems.reduce((sum, item) => sum + Number(item.price) * item.amount, 0).toFixed(2)} сом
📅 *Дата:* ${new Date(order.createdAt).toLocaleString('ru-RU')}

${order.customerComment ? `💬 *Комментарий:* ${order.customerComment}` : ''}

*Товары:*
${order.orderItems.map(item => 
  `• ${item.product.name} (${item.amount} шт.) - ${(Number(item.price) * item.amount).toFixed(2)} сом`
).join('\n')}`

    console.log('Telegram: Отправляем сообщение...')
    
    // Создаем клавиатуру
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📋 Посмотреть заказ',
            url: `https://google.com`
          }
        ]
      ]
    }
    
    // Проверяем длину сообщения
    if (!checkMessageLength(message, keyboard)) {
      console.warn('Telegram: Отправляем сообщение без кнопки из-за превышения лимита')
      const sendMessagePromise = bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Telegram API timeout')), 10000)
      })
      
      await Promise.race([sendMessagePromise, timeoutPromise])
      return
    }
    
    // Создаем Promise с таймаутом
    const sendMessagePromise = bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Telegram API timeout')), 10000) // 10 секунд таймаут
    })
    
    // Отправляем сообщение с таймаутом
    await Promise.race([sendMessagePromise, timeoutPromise])

    console.log('Telegram: Уведомление отправлено успешно для заказа:', order.id)
  } catch (error) {
    console.error('Ошибка отправки Telegram уведомления:', error)
    
    // Не пробрасываем ошибку дальше, чтобы не прерывать основной процесс
    // Просто логируем ошибку
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log('Telegram: Таймаут при отправке уведомления')
      } else if (error.message.includes('ETELEGRAM')) {
        console.log('Telegram: Ошибка API Telegram')
      }
    }
  }
}

// Функция для отправки уведомления об изменении статуса заказа
export async function sendOrderStatusUpdateNotification(order: OrderWithDetails, oldStatus: string) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID!
    
    const statusLabels = {
      'CREATED': 'Создан',
      'COURIER_WAIT': 'Ожидает курьера',
      'COURIER_PICKED': 'Принят курьером',
      'ENROUTE': 'В пути',
      'DELIVERED': 'Доставлен',
      'CANCELED': 'Отменен'
    }

    // Специальное сообщение для принятия заказа курьером
    if (oldStatus === 'COURIER_WAIT' && order.status === 'COURIER_PICKED') {
      const message = `✅ *Вы взяли заказ #${order.id.slice(-8)}*

📍 *Адрес:* ${order.deliveryAddress}
👤 *Клиент:* ${order.customerName}
📞 *Телефон:* ${order.customerPhone}

${order.customerComment ? `💬 *Комментарий:* ${order.customerComment}` : ''}

🚚 *Курьер:* ${order.courier ? order.courier.fullname : 'Не назначен'}`
      
      // Создаем клавиатуру
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📦 Мои заказы',
              url: 'https://google.com'
            }
          ]
        ]
      }
      
      // Проверяем длину сообщения
      if (!checkMessageLength(message, keyboard)) {
        console.warn('Telegram: Отправляем сообщение без кнопки из-за превышения лимита')
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown'
        })
        return
      }
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
      return
    }

    const message = `🔄 *Обновление заказа #${order.id.slice(-8)}*

Статус изменен: *${statusLabels[oldStatus as keyof typeof statusLabels]}* → *${statusLabels[order.status as keyof typeof statusLabels]}*

📍 *Адрес:* ${order.deliveryAddress}

${order.courier ? `🚚 *Курьер:* ${order.courier.fullname}` : ''}`

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    })

    console.log('Telegram уведомление об обновлении статуса отправлено для заказа:', order.id)
  } catch (error) {
    console.error('Ошибка отправки Telegram уведомления об обновлении статуса:', error)
  }
}

// Функция для тестирования бота
export async function testTelegramBot() {
  try {
    console.log('Telegram: Начинаем тестирование бота...')
    
    // Проверяем наличие переменных окружения
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN не найден в переменных окружения')
    }
    
    if (!process.env.TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID не найден в переменных окружения')
    }

    const chatId = process.env.TELEGRAM_CHAT_ID
    console.log('Telegram: Chat ID:', chatId)
    console.log('Telegram: Bot Token настроен:', !!process.env.TELEGRAM_BOT_TOKEN)
    
    // Проверяем, что Chat ID является числом
    if (isNaN(Number(chatId))) {
      throw new Error('TELEGRAM_CHAT_ID должен быть числом. Получено: ' + chatId)
    }

    console.log('Telegram: Отправляем тестовое сообщение...')
    
    // Создаем Promise с таймаутом для тестового сообщения
    const sendMessagePromise = bot.sendMessage(chatId, '🤖 Telegram бот работает! Уведомления о заказах активированы.')
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Telegram API timeout')), 10000) // 10 секунд таймаут
    })
    
    // Отправляем сообщение с таймаутом
    await Promise.race([sendMessagePromise, timeoutPromise])
    
    console.log('✅ Тестовое сообщение отправлено в Telegram')
  } catch (error) {
    console.error('❌ Ошибка тестирования Telegram бота:', error)
    throw error // Пробрасываем ошибку для обработки в API
  }
}
