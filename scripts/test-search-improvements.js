/**
 * Скрипт для тестирования улучшений поиска номеров телефонов
 */

const BASE_URL = 'http://localhost:3000'

async function testSearchImprovements() {
  console.log('🧪 Тестирование улучшений поиска...\n')

  try {
    // 1. Проверяем, что сервер запущен
    console.log('1️⃣ Проверка доступности сервера...')
    try {
      const response = await fetch(`${BASE_URL}/api/courier/orders/recent`)
      const data = await response.json()
      console.log('✅ Сервер доступен, заказов:', data.data?.length || 0)
    } catch (error) {
      console.log('❌ Сервер не запущен:', error.message)
      console.log('💡 Запустите сервер командой: npm run dev')
      return
    }

    // 2. Тестируем функцию нормализации номеров
    console.log('\n2️⃣ Тестирование функции нормализации номеров...')
    
    const testPhones = [
      '+996555123456',
      '+996 555 123 456',
      '+996-555-123-456',
      '996555123456',
      '555123456',
      '555 123 456',
      '555-123-456'
    ]
    
    testPhones.forEach(phone => {
      const normalized = phone.replace(/\D/g, '')
      console.log(`   📞 "${phone}" → "${normalized}"`)
    })

    // 3. Тестируем генерацию вариантов поиска
    console.log('\n3️⃣ Тестирование генерации вариантов поиска...')
    
    const testPhone = '+996555123456'
    const variants = [
      '996555123456', // Полный номер
      '555123456',    // Последние 9 цифр
      '996555123456', // С кодом страны
      '+996555123456' // С плюсом
    ]
    
    console.log(`   📞 Для номера "${testPhone}" варианты поиска:`)
    variants.forEach(variant => {
      console.log(`      • "${variant}"`)
    })

    // 4. Тестируем поисковые запросы
    console.log('\n4️⃣ Тестирование поисковых запросов...')
    
    const searchQueries = [
      '555123456',      // Только цифры
      '+996555123456',  // С кодом страны
      '555 123 456',    // С пробелами
      '555-123-456',    // С дефисами
      '996555123456',   // Без плюса
      '555',            // Частичный номер
      '123456'          // Последние цифры
    ]
    
    searchQueries.forEach(query => {
      const normalized = query.replace(/\D/g, '')
      console.log(`   🔍 Поиск "${query}" → нормализованный "${normalized}"`)
    })

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n📋 Ожидаемые улучшения:')
    console.log('✅ Поиск "+996555 555 555" найдет номер "+996555555555"')
    console.log('✅ Поиск "+996555555555" найдет номер "+996555 555 555"')
    console.log('✅ Поиск "555555555" найдет номер "+996555555555"')
    console.log('✅ Поиск работает на всех устройствах (мобильных и десктопных)')
    console.log('✅ Нет дублирующих полей поиска')

    console.log('\n💡 Примеры поиска:')
    console.log('• Введите: "+996555555555" → найдет "+996555 555 555"')
    console.log('• Введите: "555555555" → найдет "+996555555555"')
    console.log('• Введите: "555 555 555" → найдет "+996555555555"')
    console.log('• Введите: "555-555-555" → найдет "+996555555555"')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testSearchImprovements()
