const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBotUpdates() {
  try {
    console.log('🔍 Тестирование получения обновлений...')

    // Получаем токен
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'TELEGRAM_BOT_TOKEN' }
    })

    if (!tokenSetting) {
      console.log('❌ Токен не найден')
      return
    }

    const bot = new TelegramBot(tokenSetting.value, { polling: false })
    
    // Проверяем информацию о боте
    console.log('📡 Проверяем информацию о боте...')
    const botInfo = await bot.getMe()
    console.log('🤖 Бот:', botInfo.username)

    // Получаем последние обновления
    console.log('📥 Получаем последние обновления...')
    const updates = await bot.getUpdates()
    
    console.log(`📊 Найдено обновлений: ${updates.length}`)
    
    if (updates.length > 0) {
      console.log('📋 Последние 3 обновления:')
      updates.slice(-3).forEach((update, index) => {
        console.log(`${index + 1}. Update ID: ${update.update_id}`)
        if (update.message) {
          console.log(`   Сообщение: "${update.message.text}"`)
          console.log(`   От: ${update.message.from?.first_name}`)
          console.log(`   Chat ID: ${update.message.chat.id}`)
        }
      })
    } else {
      console.log('ℹ️ Нет новых сообщений')
    }

    console.log('\n💡 Если обновлений нет:')
    console.log('1. Отправьте /start в бота @rossatommbot')
    console.log('2. Запустите этот скрипт снова')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testBotUpdates()
