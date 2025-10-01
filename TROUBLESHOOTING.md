# 🔧 Решение проблем с подключением

## Проблема: "Failed to fetch" ошибки

### ❌ Симптомы:
```
Console TypeError
Failed to fetch
Call Stack
CourierDashboard.useCallback[fetchOrders]
CourierDashboard.useCallback[checkForNewOrders]
```

### 🔍 Причины:
1. **Сервер не запущен** - Next.js dev server не работает
2. **Проблемы с базой данных** - Prisma не может подключиться
3. **Сетевые проблемы** - Блокировка портов или firewall
4. **Неправильные URL** - API endpoints недоступны

## ✅ Решения

### 1. 🚀 Запуск сервера
```bash
# Убедитесь, что сервер запущен
npm run dev

# Должно показать:
# ✓ Ready in 2.3s
# ○ Local: http://localhost:3000
```

### 2. 🔧 Тест подключения
Добавлена кнопка "🔧 Тест" в dashboard для проверки:
- ✅ **Если OK** - сервер работает
- ❌ **Если ошибка** - сервер недоступен

### 3. 📊 Улучшенная обработка ошибок

#### В `checkForNewOrders`:
```typescript
catch (error) {
  console.error('Ошибка проверки новых заказов:', error)
  setConnectionStatus('disconnected')
  
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Таймаут при проверке новых заказов')
    } else if (error.message.includes('Failed to fetch')) {
      console.log('🌐 Проблема с подключением к серверу')
    }
  }
}
```

#### В `fetchOrders`:
```typescript
catch (error) {
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    console.log('🌐 Сервер недоступен - проверьте, что сервер запущен')
    setConnectionStatus('disconnected')
  }
}
```

### 4. 🎯 Визуальные индикаторы

#### Статус подключения:
- 🟢 **Подключено** - все API работают
- 🔴 **Отключено** - проблемы с подключением
- 🟡 **Проверка...** - инициализация

#### Счетчик заказов:
- Показывает текущее количество доступных заказов
- Обновляется каждые 5 секунд

## 🧪 Тестирование

### 1. Проверка сервера:
```bash
# Откройте в браузере:
http://localhost:3000/api/test/connection

# Должен вернуть:
{
  "success": true,
  "data": {
    "status": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "server": "Next.js API"
  }
}
```

### 2. Проверка API endpoints:
```bash
# Счетчик заказов:
http://localhost:3000/api/courier/orders/count

# Последние заказы:
http://localhost:3000/api/courier/orders/recent?limit=5
```

### 3. Проверка в dashboard:
1. Откройте `/courier/dashboard`
2. Нажмите кнопку "🔧 Тест"
3. Проверьте статус подключения
4. Посмотрите логи в консоли

## 🔄 Workflow диагностики

### Шаг 1: Проверка сервера
```bash
npm run dev
# Убедитесь, что сервер запустился без ошибок
```

### Шаг 2: Проверка базы данных
```bash
npm run db:push
# Убедитесь, что схема применена
```

### Шаг 3: Проверка API
- Откройте `/api/test/connection`
- Проверьте ответ сервера

### Шаг 4: Проверка dashboard
- Откройте `/courier/dashboard`
- Нажмите "🔧 Тест"
- Проверьте статус подключения

## 📋 Логи для отладки

### Успешное подключение:
```
✅ API: Тест подключения
✅ API: Количество доступных заказов: 3
✅ Заказы загружены успешно: 5
```

### Ошибки подключения:
```
❌ Ошибка получения счетчика: 500 Internal Server Error
🌐 Сервер недоступен - проверьте, что сервер запущен
❌ Ошибка проверки новых заказов: TypeError: Failed to fetch
```

## 🛠️ Дополнительные решения

### Если проблема с базой данных:
```bash
# Перезапустите Prisma
npx prisma generate
npx prisma db push
```

### Если проблема с портами:
```bash
# Проверьте, что порт 3000 свободен
netstat -an | findstr :3000
```

### Если проблема с переменными окружения:
```bash
# Проверьте .env.local
cat .env.local
```

## ✅ Результат

После применения исправлений:
- ✅ **Детальная диагностика** ошибок подключения
- ✅ **Визуальные индикаторы** статуса
- ✅ **Тестовая кнопка** для быстрой проверки
- ✅ **Улучшенные логи** для отладки
- ✅ **Graceful handling** ошибок сети
