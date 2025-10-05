const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetChatId() {
  try {
    await prisma.setting.update({
      where: { key: 'COURIER_CHAT_ID' },
      data: { value: '{}' }
    })
    console.log('✅ COURIER_CHAT_ID сброшен в пустой JSON объект')
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetChatId()
