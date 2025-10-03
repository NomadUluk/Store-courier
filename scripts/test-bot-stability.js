/**
 * Скрипт для тестирования стабильности Telegram бота
 * Проверяет исправления таймаутов и бесконечных циклов
 */

// Используем встроенный fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000'

async function testBotStability() {
  console.log('🧪 Тестирование стабильности Telegram бота...\n')

  try {
    // 1. Сброс счетчиков перезапуска
    console.log('1️⃣ Сброс счетчиков перезапуска...')
    try {
      const resetResponse = await fetch(`${BASE_URL}/api/telegram/force-stop`, {
        method: 'POST'
      })
      const resetData = await resetResponse.json()
      console.log('🔄 Результат сброса:', resetData)
    } catch (error) {
      console.log('⚠️ Ошибка сброса (это нормально если сервер не запущен):', error.message)
    }

    // 2. Проверка webhook статуса
    console.log('\n2️⃣ Проверка статуса webhook...')
    try {
      const webhookResponse = await fetch(`${BASE_URL}/api/telegram/check-webhook`)
      const webhookData = await webhookResponse.json()
      console.log('📊 Статус webhook:', webhookData)
    } catch (error) {
      console.log('❌ Сервер не запущен:', error.message)
      console.log('💡 Запустите сервер командой: npm run dev')
      return
    }

    // 3. Тестирование запуска бота
    console.log('\n3️⃣ Тестирование запуска бота...')
    try {
      const startResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const startData = await startResponse.json()
      console.log('🚀 Результат запуска:', startData)
      
      if (startData.success) {
        console.log('✅ Бот успешно запущен!')
      } else if (startData.error.includes('уже запущен')) {
        console.log('✅ Бот уже запущен и работает!')
      } else {
        console.log('❌ Ошибка запуска:', startData.error)
      }
    } catch (error) {
      console.log('❌ Ошибка тестирования:', error.message)
    }

    // 4. Проверка стабильности (несколько попыток)
    console.log('\n4️⃣ Проверка стабильности (3 попытки)...')
    for (let i = 1; i <= 3; i++) {
      console.log(`\n   Попытка ${i}/3:`)
      
      try {
        const testResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
          method: 'POST'
        })
        const testData = await testResponse.json()
        
        if (testData.success) {
          console.log(`   ✅ Попытка ${i}: Успешно`)
        } else if (testData.error.includes('уже запущен')) {
          console.log(`   ✅ Попытка ${i}: Бот уже работает`)
        } else {
          console.log(`   ⚠️ Попытка ${i}: ${testData.error}`)
        }
        
        // Небольшая пауза между попытками
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.log(`   ❌ Попытка ${i}: Ошибка - ${error.message}`)
      }
    }

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n📋 Ожидаемые результаты:')
    console.log('✅ Нет бесконечных циклов перезапуска')
    console.log('✅ Нет ETIMEDOUT ошибок в логах')
    console.log('✅ Бот запускается стабильно')
    console.log('✅ Защита от частых перезапусков работает')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testBotStability()
