const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkBotToken() {
  try {
    console.log('🔍 Проверка токена Telegram бота...')

    // Получаем токен из базы данных
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'COURIER_BOT_TOKEN' }
    })

    if (!tokenSetting || !tokenSetting.value) {
      console.log('❌ Токен бота не найден в базе данных')
      return
    }

    console.log('📋 Токен найден:', tokenSetting.value.slice(0, 10) + '...')

    // Создаем экземпляр бота
    const bot = new TelegramBot(tokenSetting.value, { polling: false })

    // Тестируем getMe
    console.log('📡 Проверяем соединение с Telegram API...')
    
    try {
      const botInfo = await bot.getMe()
      console.log('✅ Бот подключен успешно!')
      console.log('🤖 Информация о боте:')
      console.log(`   - ID: ${botInfo.id}`)
      console.log(`   - Имя: ${botInfo.first_name}`)
      console.log(`   - Username: @${botInfo.username}`)
      console.log(`   - Может присоединяться к группам: ${botInfo.can_join_groups}`)
      console.log(`   - Может читать все сообщения: ${botInfo.can_read_all_group_messages}`)
      
      console.log('\n🎉 Токен действителен! Бот готов к работе.')
      console.log(`💡 Найдите бота в Telegram: @${botInfo.username}`)
      
    } catch (apiError) {
      console.error('❌ Ошибка подключения к Telegram API:', apiError.message)
      
      if (apiError.message.includes('401')) {
        console.log('🔑 Проблема с токеном - он недействителен или отозван')
      } else if (apiError.message.includes('network')) {
        console.log('🌐 Проблема с сетевым соединением')
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBotToken()
