/**
 * Скрипт для тестирования API endpoints
 * Проверяет доступность всех Telegram API endpoints
 */

// Используем встроенный fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000'

async function testApiEndpoints() {
  console.log('🧪 Тестирование API endpoints...\n')

  const endpoints = [
    { name: 'Start Polling', url: '/api/telegram/start-polling', method: 'POST' },
    { name: 'Test Message', url: '/api/telegram/test-message', method: 'POST' },
    { name: 'Simple Test', url: '/api/telegram/simple-test', method: 'POST' },
    { name: 'Force Stop', url: '/api/telegram/force-stop', method: 'POST' }
  ]

  for (const endpoint of endpoints) {
    console.log(`🔍 Тестирование: ${endpoint.name}`)
    console.log(`   URL: ${endpoint.method} ${endpoint.url}`)
    
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      // Добавляем тело запроса для POST запросов
      if (endpoint.method === 'POST') {
        if (endpoint.url.includes('test-message')) {
          options.body = JSON.stringify({
            message: '🤖 Тест API endpoint'
          })
        }
      }
      
      const response = await fetch(`${BASE_URL}${endpoint.url}`, options)
      const data = await response.json()
      
      console.log(`   ✅ Статус: ${response.status}`)
      console.log(`   📊 Ответ:`, data)
      
      if (response.status === 404) {
        console.log(`   ❌ ОШИБКА 404: Endpoint не найден!`)
      } else if (response.status >= 400) {
        console.log(`   ⚠️ Ошибка ${response.status}: ${data.error || 'Неизвестная ошибка'}`)
      } else {
        console.log(`   ✅ Успешно`)
      }
      
    } catch (error) {
      console.log(`   ❌ Ошибка подключения: ${error.message}`)
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        console.log(`   💡 Сервер не запущен! Запустите: npm run dev`)
      }
    }
    
    console.log('') // Пустая строка для разделения
  }

  console.log('🏁 Тестирование завершено!')
}

// Запускаем тест
testApiEndpoints()
