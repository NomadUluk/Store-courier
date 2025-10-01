# 🔧 Исправление отправки сообщений в Telegram

## Проблема
Сообщения в Telegram не приходят, возможно из-за inline кнопок с URL ссылками.

## ✅ Решение

### 1. 🚫 Убраны URL ссылки из кнопок
**Было:**
```typescript
reply_markup: {
  inline_keyboard: [
    [
      {
        text: '📋 Посмотреть заказ',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/courier/dashboard?order=${order.id}`
      }
    ]
  ]
}
```

**Стало:**
```typescript
// Временно убраны кнопки для тестирования
const sendMessagePromise = bot.sendMessage(chatId, message, {
  parse_mode: 'Markdown'
})
```

### 2. 📝 Упрощены сообщения
Теперь сообщения отправляются без кнопок, только с текстом:

#### Новый заказ:
```
🆕 Новый заказ!

📋 Заказ #12345678
📍 Адрес: ул. Примерная, 123
💰 Сумма: 1500.00 сом
📅 Дата: 15.01.2024, 14:30

Товары:
• Хлеб (2 шт.) - 100.00 сом
• Молоко (1 шт.) - 80.00 сом
```

#### Принятый заказ:
```
✅ Вы взяли заказ #12345678

📍 Адрес: ул. Примерная, 123
👤 Клиент: Петр Петров
📞 Телефон: +996 555 123 456
💬 Комментарий: Позвонить за час до доставки
🚚 Курьер: Иван Иванов
```

### 3. 🔧 Улучшена функция тестирования
Добавлены детальные логи для диагностики:

```typescript
export async function testTelegramBot() {
  try {
    console.log('Telegram: Начинаем тестирование бота...')
    
    // Проверка переменных окружения
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN не найден')
    }
    
    if (!process.env.TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID не найден')
    }

    const chatId = process.env.TELEGRAM_CHAT_ID
    console.log('Telegram: Chat ID:', chatId)
    console.log('Telegram: Bot Token настроен:', !!process.env.TELEGRAM_BOT_TOKEN)
    
    // Проверка Chat ID
    if (isNaN(Number(chatId))) {
      throw new Error('TELEGRAM_CHAT_ID должен быть числом. Получено: ' + chatId)
    }

    console.log('Telegram: Отправляем тестовое сообщение...')
    
    // Отправка с таймаутом
    const sendMessagePromise = bot.sendMessage(chatId, '🤖 Telegram бот работает!')
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Telegram API timeout')), 10000)
    })
    
    await Promise.race([sendMessagePromise, timeoutPromise])
    console.log('✅ Тестовое сообщение отправлено в Telegram')
  } catch (error) {
    console.error('❌ Ошибка тестирования Telegram бота:', error)
    throw error
  }
}
```

## 🧪 Тестирование

### 1. Проверьте настройки в `.env.local`:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 2. Протестируйте бота:
1. Откройте dashboard курьера
2. Нажмите на аватар в правом верхнем углу
3. Выберите "🤖 Тест Telegram бота"
4. Проверьте результат

### 3. Проверьте логи в консоли:
```
Telegram: Начинаем тестирование бота...
Telegram: Chat ID: 123456789
Telegram: Bot Token настроен: true
Telegram: Отправляем тестовое сообщение...
✅ Тестовое сообщение отправлено в Telegram
```

## 🔍 Диагностика проблем

### Если ошибка "TELEGRAM_BOT_TOKEN не найден":
```env
# Добавьте в .env.local:
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

### Если ошибка "TELEGRAM_CHAT_ID не найден":
```env
# Добавьте в .env.local:
TELEGRAM_CHAT_ID=your_chat_id_number
```

### Если ошибка "TELEGRAM_CHAT_ID должен быть числом":
```env
# Убедитесь, что Chat ID - это число:
TELEGRAM_CHAT_ID=123456789  # ✅ Правильно
TELEGRAM_CHAT_ID="@username"  # ❌ Неправильно
```

### Если ошибка "Telegram API timeout":
- Проверьте интернет соединение
- Проверьте, что бот добавлен в чат
- Проверьте права бота на отправку сообщений

## 📋 Возможные причины проблем

### 1. **Неправильные настройки:**
- Неверный TELEGRAM_BOT_TOKEN
- Неверный TELEGRAM_CHAT_ID
- Chat ID не является числом

### 2. **Проблемы с ботом:**
- Бот не добавлен в чат
- Бот заблокирован
- Нет прав на отправку сообщений

### 3. **Проблемы с сетью:**
- Нет интернет соединения
- Блокировка Telegram API
- Таймауты запросов

### 4. **Проблемы с кнопками:**
- URL ссылки могут блокировать отправку
- Неправильный формат кнопок
- Проблемы с callback_data

## ✅ Результат

После исправления:
- ✅ **Убраны проблемные кнопки** с URL ссылками
- ✅ **Упрощены сообщения** - только текст
- ✅ **Улучшена диагностика** - детальные логи
- ✅ **Добавлены таймауты** для надежности
- ✅ **Проверка настроек** перед отправкой

## 🎯 Следующие шаги

### Если сообщения теперь приходят:
1. ✅ **Проблема была в кнопках** - можно добавить их обратно позже
2. ✅ **Система работает** - уведомления приходят
3. ✅ **Можно тестировать** полную функциональность

### Если сообщения все еще не приходят:
1. 🔍 **Проверьте настройки** в `.env.local`
2. 🔍 **Проверьте логи** в консоли
3. 🔍 **Проверьте бота** в Telegram
4. 🔍 **Проверьте интернет** соединение

Теперь система должна работать без проблем с кнопками!
