const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCouriers() {
  try {
    console.log('🔍 Проверка курьеров в системе...')

    const couriers = await prisma.user.findMany({
      where: { role: 'COURIER' }
    })

    console.log(`📊 Найдено курьеров: ${couriers.length}`)
    
    if (couriers.length > 0) {
      console.log('\n👥 Список курьеров:')
      couriers.forEach((courier, index) => {
        console.log(`${index + 1}. ${courier.fullname} - ${courier.phoneNumber} (ID: ${courier.id})`)
      })
    } else {
      console.log('\n❌ Курьеры не найдены в системе')
      console.log('💡 Добавьте курьера через админ панель или создайте тестового:')
      console.log(`
const testCourier = await prisma.user.create({
  data: {
    fullname: 'Тестовый Курьер',
    phoneNumber: '+996700123456',
    password: 'password123',
    role: 'COURIER'
  }
})`)
    }

    // Проверим настройки Telegram
    const telegramSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['COURIER_BOT_TOKEN', 'COURIER_CHAT_ID']
        }
      }
    })

    console.log('\n📱 Настройки Telegram:')
    telegramSettings.forEach(setting => {
      if (setting.key === 'COURIER_BOT_TOKEN') {
        console.log(`  ${setting.key}: ${setting.value ? 'установлен' : 'не установлен'}`)
      } else {
        console.log(`  ${setting.key}: ${setting.value}`)
      }
    })

  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCouriers()
