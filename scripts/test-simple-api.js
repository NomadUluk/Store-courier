/**
 * Простой тест API endpoint
 */

// Используем встроенный fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000'

async function testSimpleApi() {
  console.log('🧪 Тестирование простого API endpoint...\n')

  try {
    const response = await fetch(`${BASE_URL}/api/telegram/simple-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: '🤖 Простой тест API'
      })
    })
    
    const data = await response.json()
    
    console.log('📊 Статус:', response.status)
    console.log('📊 Ответ:', data)
    
    if (response.ok) {
      console.log('✅ Простой API endpoint работает!')
    } else {
      console.log('❌ Простой API endpoint не работает')
    }
    
  } catch (error) {
    console.log('❌ Ошибка:', error.message)
  }
}

// Запускаем тест
testSimpleApi()
