const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetChatId() {
  try {
    await prisma.setting.update({
      where: { key: 'TELEGRAM_CHAT_ID' },
      data: { value: '{}' }
    })
    console.log('✅ TELEGRAM_CHAT_ID сброшен в пустой JSON объект')
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetChatId()
