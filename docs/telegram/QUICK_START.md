# Быстрый запуск Telegram бота

## Шаг 1: Создание бота

1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Введите имя бота (например: "Store Courier Bot")
4. Введите username бота (например: "store_courier_bot")
5. Сохраните полученный токен

## Шаг 2: Сохранение токена

Выполните POST запрос к `/api/telegram/settings`:

```bash
curl -X POST http://localhost:3000/api/telegram/settings \
  -H "Content-Type: application/json" \
  -d '{"botToken": "ВАШТОКЕН"}'
```

## Шаг 3: Установка webhook

```bash
curl -X POST http://localhost:3000/api/telegram/setup-webhook
```

## Шаг 4: Добавление курьеров

1. Убедитесь, что курьеры добавлены в базу данных с ролью `COURIER`
2. Курьеры должны иметь корректные номера телефонов

## Шаг 5: Регистрация курьеров

1. Курьер находит вашего бота в Telegram
2. Отправляет команду `/start`
3. Нажимает кнопку "Поделиться номером телефона"
4. Получает подтверждение регистрации

## Шаг 6: Тестирование

```bash
curl -X POST http://localhost:3000/api/test/telegram
```

## Готово!

Теперь курьеры будут получать уведомления о новых заказах в Telegram.

## Проверка статуса

Проверить настройки:
```bash
curl http://localhost:3000/api/telegram/settings
```

Проверить webhook:
```bash
curl http://localhost:3000/api/telegram/setup-webhook
```
