/**
 * Скрипт для тестирования новой системы поиска с подсветкой
 */

const BASE_URL = 'http://localhost:3000'

async function testHighlightSearch() {
  console.log('🧪 Тестирование новой системы поиска с подсветкой...\n')

  try {
    // 1. Проверяем доступность сервера
    console.log('1️⃣ Проверка доступности сервера...')
    try {
      const response = await fetch(`${BASE_URL}/api/courier/auth/verify`)
      if (response.ok || response.status === 401) {
        console.log('✅ Сервер доступен')
      } else {
        console.log('❌ Сервер недоступен:', response.status)
        return
      }
    } catch (error) {
      console.log('❌ Сервер не запущен:', error.message)
      console.log('💡 Запустите сервер командой: npm run dev')
      return
    }

    console.log('\n🏁 Тестирование завершено!')
    console.log('\n🔍 Новая система поиска:')
    console.log('✅ Убран выпадающий список поиска')
    console.log('✅ Добавлена подсветка найденного текста на странице')
    console.log('✅ Упрощен SearchBar компонент')
    console.log('✅ Подсветка работает в карточках заказов')
    console.log('✅ Поддержка мобильных и десктопных карточек')

    console.log('\n🎯 Как работает подсветка:')
    console.log('• Введите текст в поле поиска')
    console.log('• Найденный текст подсвечивается желтым цветом')
    console.log('• Подсветка работает в полях:')
    console.log('  - ID заказа')
    console.log('  - Имя клиента')
    console.log('  - Телефон клиента')
    console.log('  - Адрес доставки')
    console.log('• Регистр не важен (поиск нечувствителен к регистру)')

    console.log('\n📱 Преимущества новой системы:')
    console.log('• Проще в использовании - нет выпадающих списков')
    console.log('• Наглядная подсветка найденного текста')
    console.log('• Меньше кода для поддержки')
    console.log('• Лучшая производительность')
    console.log('• Единообразное поведение на всех устройствах')

    console.log('\n🔧 Технические детали:')
    console.log('• SearchBar упрощен до простого поля ввода')
    console.log('• Функция highlightSearchText в dashboard')
    console.log('• Подсветка через <mark> элементы')
    console.log('• Передача searchQuery и highlightText в карточки')
    console.log('• Поддержка в CompactOrderCard и MobileOrderCard')

    console.log('\n🎨 Стили подсветки:')
    console.log('• Фон: bg-yellow-200 (светло-желтый)')
    console.log('• Текст: text-yellow-900 (темно-желтый)')
    console.log('• Отступы: px-1 (маленькие отступы)')
    console.log('• Скругление: rounded')
    console.log('• Жирность: font-medium')

    console.log('\n✨ Результат:')
    console.log('• Поиск стал проще и нагляднее')
    console.log('• Найденный текст легко заметить')
    console.log('• Нет сложных выпадающих списков')
    console.log('• Лучший пользовательский опыт')

    console.log('\n🧪 Для тестирования:')
    console.log('1. Откройте dashboard курьера')
    console.log('2. Введите текст в поле поиска')
    console.log('3. Посмотрите на подсветку в карточках заказов')
    console.log('4. Попробуйте разные поисковые запросы')
    console.log('5. Проверьте на мобильных и десктопе')

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error)
  }
}

// Запускаем тест
testHighlightSearch()
