/**
 * Скрипт для тестирования улучшенной логики Telegram бота
 * Проверяет отсутствие автоматических перезапусков и стабильность работы
 */

const BASE_URL = 'http://localhost:3000'

async function testImprovedBotLogic() {
  console.log('🧪 Тестирование улучшенной логики Telegram бота...\n')

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
    console.log('\n2️⃣ Проверка статуса бота...')
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
        console.log('❌ Неожиданная ошибка:', statusData.error)
      }
    } catch (error) {
      console.log('❌ Ошибка проверки статуса:', error.message)
    }

    // 3. Тестируем повторный запуск (должен быть заблокирован)
    console.log('\n3️⃣ Тестирование повторного запуска...')
    try {
      const duplicateResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const duplicateData = await duplicateResponse.json()
      
      if (duplicateData.success === false && duplicateData.error.includes('уже запущен')) {
        console.log('✅ Повторный запуск корректно заблокирован!')
      } else {
        console.log('⚠️ Неожиданное поведение при повторном запуске:', duplicateData)
      }
    } catch (error) {
      console.log('❌ Ошибка тестирования повторного запуска:', error.message)
    }

    // 4. Проверяем стабильность (несколько запросов подряд)
    console.log('\n4️⃣ Тестирование стабильности (5 запросов)...')
    for (let i = 1; i <= 5; i++) {
      try {
        const testResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
          method: 'POST'
        })
        const testData = await testResponse.json()
        
        if (testData.success === false && testData.error.includes('уже запущен')) {
          console.log(`   ✅ Запрос ${i}/5: Корректно заблокирован`)
        } else {
          console.log(`   ⚠️ Запрос ${i}/5: Неожиданный результат`)
        }
        
        // Небольшая пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.log(`   ❌ Запрос ${i}/5: Ошибка - ${error.message}`)
      }
    }

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n📋 Ожидаемые улучшения:')
    console.log('✅ Нет автоматических перезапусков при ошибке 409')
    console.log('✅ Бот запускается при старте сервера')
    console.log('✅ Корректная блокировка повторных запусков')
    console.log('✅ Стабильная работа без бесконечных циклов')
    console.log('✅ Улучшенное логирование ошибок')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testImprovedBotLogic()
