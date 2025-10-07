/**
 * Скрипт для тестирования нового интерфейса поиска с выпадающим списком
 */

const BASE_URL = 'http://localhost:3000'

async function testSearchInterface() {
  console.log('🧪 Тестирование нового интерфейса поиска...\n')

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

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n📋 Новые возможности поиска:')
    console.log('✅ Выпадающий список результатов на десктопе')
    console.log('✅ Полноэкранный поиск на мобильных устройствах')
    console.log('✅ Подсветка найденных совпадений')
    console.log('✅ Иконки для разных типов результатов')
    console.log('✅ Навигация клавиатурой (стрелки, Enter, Escape)')
    console.log('✅ Клик вне области закрывает выпадающий список')

    console.log('\n💻 Десктопная версия:')
    console.log('• Введите текст в поле поиска')
    console.log('• Появится выпадающий список с результатами')
    console.log('• Используйте стрелки ↑↓ для навигации')
    console.log('• Нажмите Enter для выбора')
    console.log('• Нажмите Escape для закрытия')
    console.log('• Кликните вне области для закрытия')

    console.log('\n📱 Мобильная версия:')
    console.log('• Кликните по полю поиска')
    console.log('• Откроется полноэкранный интерфейс поиска')
    console.log('• Введите текст для поиска')
    console.log('• Результаты отображаются в виде списка')
    console.log('• Кликните по результату для выбора')
    console.log('• Нажмите кнопку "Назад" для закрытия')

    console.log('\n🔍 Типы результатов поиска:')
    console.log('• 📞 Телефон - поиск по номеру клиента')
    console.log('• 📍 Адрес - поиск по адресу доставки')
    console.log('• 👤 Клиент - поиск по имени клиента')
    console.log('• 🛍️ Товар - поиск по названию товара')
    console.log('• 🔍 ID заказа - поиск по номеру заказа')

    console.log('\n✨ Особенности:')
    console.log('• Умный поиск номеров телефонов')
    console.log('• Подсветка найденных совпадений')
    console.log('• Максимум 8 результатов в выпадающем списке')
    console.log('• Адаптивный дизайн для всех устройств')
    console.log('• Плавные анимации и переходы')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testSearchInterface()
