# Пример файла .env

Создайте файл `.env` в корне проекта со следующими переменными:

```env
# ============================================
# Database Configuration
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/store_courier_db?schema=public"

# ============================================
# JWT Configuration
# ============================================
# Секретный ключ для генерации JWT токенов
# В продакшене используйте длинный случайный ключ!
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-minimum-32-characters-long"

# ============================================
# Server Configuration
# ============================================
NODE_ENV="development"
# URL вашего приложения (для Telegram кнопок и т.д.)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ============================================
# Telegram Bot Configuration (опционально)
# ============================================
# Токен можно настроить через админ панель в базе данных
# или указать здесь для первичной настройки
# TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
```

## 📝 Инструкции по настройке

### 1. База данных (DATABASE_URL)
- Замените `username`, `password`, `localhost:5432` на ваши данные PostgreSQL
- Можно использовать локальный PostgreSQL или облачный (например, Supabase, Neon.tech)

### 2. JWT Secret (JWT_SECRET)
- Используйте длинную случайную строку (минимум 32 символа)
- Генерация: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. App URL (NEXT_PUBLIC_APP_URL)
- Для разработки: `http://localhost:3000`
- Для продакшена: ваш реальный домен `https://yourdomain.com`

### 4. Telegram Bot Token (опционально)
- Получить токен: напишите [@BotFather](https://t.me/BotFather) в Telegram
- Команды: `/newbot` → следуйте инструкциям
- Токен можно настроить через API `/api/telegram/settings` после запуска

## ⚠️ Безопасность

**ВАЖНО:** Никогда не коммитьте файл `.env` в Git!
Файл `.env` уже добавлен в `.gitignore`.

