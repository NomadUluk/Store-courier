/**
 * Скрипт для тестирования исправления двойного запуска Telegram бота
 */

const BASE_URL = 'http://localhost:3000'

async function testSingleStartup() {
  console.log('🧪 Тестирование исправления двойного запуска...\n')

  try {
    // 1. Проверяем, что сервер запущен
    console.log('1️⃣ Проверка доступности сервера...')
    try {
      const response = await fetch(`${BASE_URL}/api/telegram/auto-start`)
      const data = await response.json()
      console.log('✅ Сервер доступен:', data.message)
      console.log('📊 Статус бота:', data.data?.isActive ? 'Активен' : 'Неактивен')
    } catch (error) {
      console.log('❌ Сервер не запущен:', error.message)
      console.log('💡 Запустите сервер командой: npm run dev')
      return
    }

    // 2. Проверяем статус бота несколько раз подряд
    console.log('\n2️⃣ Проверка стабильности статуса (5 проверок)...')
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await fetch(`${BASE_URL}/api/telegram/auto-start`)
        const data = await response.json()
        
        console.log(`   Проверка ${i}/5: ${data.data?.isActive ? '✅ Активен' : '❌ Неактивен'}`)
        
        // Небольшая пауза между проверками
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.log(`   Проверка ${i}/5: ❌ Ошибка - ${error.message}`)
      }
    }

    // 3. Тестируем ручной запуск (если бот не активен)
    console.log('\n3️⃣ Тестирование ручного запуска...')
    try {
      const statusResponse = await fetch(`${BASE_URL}/api/telegram/auto-start`)
      const statusData = await statusResponse.json()
      
      if (!statusData.data?.isActive) {
        console.log('🔄 Бот неактивен, тестируем ручной запуск...')
        
        const startResponse = await fetch(`${BASE_URL}/api/telegram/auto-start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        })
        const startData = await startResponse.json()
        console.log('📊 Результат ручного запуска:', startData.message)
      } else {
        console.log('✅ Бот уже активен, ручной запуск не нужен')
      }
    } catch (error) {
      console.log('❌ Ошибка тестирования ручного запуска:', error.message)
    }

    // 4. Проверяем API endpoints
    console.log('\n4️⃣ Проверка API endpoints...')
    const endpoints = [
      { url: '/api/telegram/auto-start', method: 'GET' },
      { url: '/api/telegram/start-polling', method: 'POST' },
      { url: '/api/telegram/force-stop', method: 'POST' }
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
          method: endpoint.method
        })
        const data = await response.json()
        console.log(`   ✅ ${endpoint.url} (${endpoint.method}): ${response.status}`)
      } catch (error) {
        console.log(`   ❌ ${endpoint.url} (${endpoint.method}): Ошибка - ${error.message}`)
      }
    }

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n📋 Ожидаемые результаты:')
    console.log('✅ Нет ошибки "ETELEGRAM 409 conflict"')
    console.log('✅ Бот запускается только один раз при старте сервера')
    console.log('✅ TelegramBotInitializer только проверяет статус')
    console.log('✅ Статус бота стабилен между проверками')
    console.log('✅ Ручное управление ботом работает корректно')

    console.log('\n💡 Логика работы:')
    console.log('• Бот запускается автоматически при старте сервера (server-init.ts)')
    console.log('• TelegramBotInitializer только проверяет статус бота')
    console.log('• API /auto-start только проверяет статус, не запускает бота')
    console.log('• Ручное управление через POST /auto-start')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testSingleStartup()
