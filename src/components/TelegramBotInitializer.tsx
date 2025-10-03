'use client'

import { useEffect } from 'react'

export default function TelegramBotInitializer() {
  useEffect(() => {
    // Запускаем автоинициализацию бота при загрузке приложения
    const initBot = async () => {
      try {
        const response = await fetch('/api/telegram/auto-start', {
          method: 'GET'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.data?.isActive) {
            console.log('✅ Telegram бот активен')
          } else {
            console.log('🔄 Запуск Telegram бота...')
          }
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации Telegram бота:', error)
      }
    }

    // Запускаем через небольшую задержку, чтобы приложение успело загрузиться
    const timer = setTimeout(initBot, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Компонент ничего не рендерит
  return null
}
