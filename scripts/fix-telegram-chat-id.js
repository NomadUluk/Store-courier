const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTelegramChatId() {
  try {
    console.log('🔧 Исправление формата TELEGRAM_CHAT_ID...')

    // Получаем текущее значение
    const currentSetting = await prisma.setting.findUnique({
      where: { key: 'TELEGRAM_CHAT_ID' }
    })

    if (!currentSetting) {
      console.log('❌ Настройка TELEGRAM_CHAT_ID не найдена')
      return
    }

    console.log('📋 Текущее значение:', currentSetting.value)

    // Проверяем, является ли значение валидным JSON
    let isValidJson = false
    try {
      JSON.parse(currentSetting.value)
      isValidJson = true
    } catch (e) {
      isValidJson = false
    }

    if (isValidJson) {
      console.log('✅ Значение уже в формате JSON')
      return
    }

    // Если это просто число, сбрасываем в пустой JSON объект
    const newValue = '{}'
    
    await prisma.setting.update({
      where: { key: 'TELEGRAM_CHAT_ID' },
      data: { value: newValue }
    })

    console.log('✅ TELEGRAM_CHAT_ID исправлен на:', newValue)
    console.log('💡 Теперь курьеры могут регистрироваться в боте')

  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTelegramChatId()
