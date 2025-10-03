import TelegramBot from 'node-telegram-bot-api'
import { getTelegramBotToken } from '@/lib/settings'

// Кэш для бота, чтобы не создавать новый экземпляр каждый раз
let botInstance: TelegramBot | null = null

// Функция для получения экземпляра бота
export async function getBot(): Promise<TelegramBot | null> {
  try {
    if (botInstance) {
      return botInstance
    }

    const token = await getTelegramBotToken()
    if (!token) {
      console.error('Telegram bot token не найден')
      return null
    }

    botInstance = new TelegramBot(token, { 
      polling: false,
      request: {
        timeout: 5000 // 5 секунд таймаут
      }
    })

    return botInstance
  } catch (error) {
    console.error('Ошибка создания экземпляра бота:', error)
    return null
  }
}
