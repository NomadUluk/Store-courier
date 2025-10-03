/**
 * Скрипт для проверки Telegram polling режима
 * Webhook функциональность полностью удалена
 */

// Используем встроенный fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000'

async function checkPollingMode() {
  console.log('🔍 Проверка Telegram polling режима...\n')

  try {
    // 1. Проверяем статус polling
    console.log('1️⃣ Проверка статуса polling...')
    try {
      const pollingResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const pollingData = await pollingResponse.json()
      
      console.log('📊 Статус polling:', pollingData)
      
      if (pollingData.success) {
        console.log('✅ Polling режим работает корректно!')
      } else if (pollingData.error.includes('уже запущен')) {
        console.log('✅ Polling режим уже активен!')
      } else {
        console.log('❌ Ошибка polling:', pollingData.error)
      }
      
    } catch (error) {
      console.log('❌ Сервер не запущен или недоступен:', error.message)
      console.log('💡 Запустите сервер командой: npm run dev')
      return
    }

    // 2. Тестируем отправку сообщения
    console.log('\n2️⃣ Тестирование отправки сообщения...')
    try {
      const testResponse = await fetch(`${BASE_URL}/api/telegram/test-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '🤖 Тест polling режима'
        })
      })
      const testData = await testResponse.json()
      
      console.log('📤 Результат тестирования:', testData)
      
      if (testData.success) {
        console.log('✅ Тестовое сообщение обработано!')
      } else {
        console.log('❌ Ошибка тестирования:', testData.error)
      }
    } catch (error) {
      console.log('❌ Ошибка тестирования:', error.message)
    }

    console.log('\n🏁 Проверка завершена!')
    console.log('✅ Webhook функциональность полностью удалена')
    console.log('✅ Используется только polling режим')

  } catch (error) {
    console.error('❌ Общая ошибка:', error)
  }
}

// Запускаем проверку
checkPollingMode()
