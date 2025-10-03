/**
 * Скрипт для тестирования исправления конфликта 409 в Telegram боте
 */

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

async function testBotConflictFix() {
  console.log('🧪 Тестирование исправления конфликта 409...\n')

  try {
    // 1. Проверяем текущий статус
    console.log('1️⃣ Проверка текущего статуса бота...')
    try {
      const statusResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const statusData = await statusResponse.json()
      console.log('📊 Статус:', statusData)
    } catch (error) {
      console.log('⚠️ Сервер не запущен или недоступен')
      return
    }

    // 2. Принудительно останавливаем все экземпляры
    console.log('\n2️⃣ Принудительная остановка всех экземпляров...')
    try {
      const stopResponse = await fetch(`${BASE_URL}/api/telegram/force-stop`, {
        method: 'POST'
      })
      const stopData = await stopResponse.json()
      console.log('🛑 Результат остановки:', stopData)
    } catch (error) {
      console.log('❌ Ошибка остановки:', error.message)
    }

    // 3. Ждём 3 секунды
    console.log('\n⏳ Ожидание 3 секунды...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 4. Запускаем бота с новой логикой
    console.log('\n3️⃣ Запуск бота с улучшенной логикой...')
    try {
      const startResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const startData = await startResponse.json()
      console.log('🚀 Результат запуска:', startData)
    } catch (error) {
      console.log('❌ Ошибка запуска:', error.message)
    }

    // 5. Проверяем, что бот работает
    console.log('\n4️⃣ Проверка работы бота...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const checkResponse = await fetch(`${BASE_URL}/api/telegram/start-polling`, {
        method: 'POST'
      })
      const checkData = await checkResponse.json()
      console.log('✅ Проверка статуса:', checkData)
      
      if (checkData.success === false && checkData.error.includes('уже запущен')) {
        console.log('🎉 УСПЕХ! Конфликт 409 предотвращён - бот корректно определяет, что уже запущен')
      } else {
        console.log('⚠️ Неожиданный результат:', checkData)
      }
    } catch (error) {
      console.log('❌ Ошибка проверки:', error.message)
    }

    console.log('\n🏁 Тестирование завершено!')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testBotConflictFix()
