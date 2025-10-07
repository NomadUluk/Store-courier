/**
 * Скрипт для тестирования исправления ошибки Turbopack с node-telegram-bot-api
 */

const BASE_URL = 'http://localhost:3000'

async function testTurbopackFix() {
  console.log('🧪 Тестирование исправления ошибки Turbopack...\n')

  try {
    // 1. Проверяем, что сервер запущен
    console.log('1️⃣ Проверка доступности сервера...')
    try {
      const response = await fetch(`${BASE_URL}/api/telegram/auto-start`)
      const data = await response.json()
      console.log('✅ Сервер доступен:', data.message)
    } catch (error) {
      console.log('❌ Сервер не запущен:', error.message)
      console.log('💡 Запустите сервер командой: npm run dev')
      return
    }

    // 2. Проверяем статус бота
    console.log('\n2️⃣ Проверка статуса Telegram бота...')
    try {
      const statusResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const statusData = await statusResponse.json()
      console.log('📊 Статус бота:', statusData)
      
      if (statusData.success) {
        console.log('✅ Бот успешно запущен!')
      } else if (statusData.error.includes('уже запущен')) {
        console.log('✅ Бот уже работает (корректное поведение)')
      } else {
        console.log('❌ Ошибка запуска:', statusData.error)
      }
    } catch (error) {
      console.log('❌ Ошибка проверки статуса:', error.message)
    }

    // 3. Проверяем работу API endpoints
    console.log('\n3️⃣ Проверка API endpoints...')
    const endpoints = [
      '/api/telegram/auto-start',
      '/api/telegram/start-polling',
      '/api/telegram/force-stop'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: endpoint.includes('start-polling') ? 'POST' : 'GET'
        })
        const data = await response.json()
        console.log(`   ✅ ${endpoint}: ${response.status} - ${data.message || 'OK'}`)
      } catch (error) {
        console.log(`   ❌ ${endpoint}: Ошибка - ${error.message}`)
      }
    }

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n📋 Ожидаемые результаты:')
    console.log('✅ Нет ошибок "Cannot read properties of undefined (reading \'node\')"')
    console.log('✅ Telegram бот импортируется корректно')
    console.log('✅ API endpoints работают без ошибок')
    console.log('✅ Сервер запускается без проблем с Turbopack')

    console.log('\n💡 Рекомендации:')
    console.log('• Используйте "npm run dev" для запуска без Turbopack')
    console.log('• Используйте "npm run dev:turbo" для запуска с Turbopack (если нужно)')
    console.log('• При проблемах с Turbopack переключитесь на обычный webpack')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testTurbopackFix()
