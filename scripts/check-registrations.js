const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRegistrations() {
  try {
    console.log('📋 Проверка зарегистрированных курьеров...')

    const setting = await prisma.setting.findUnique({
      where: { key: 'COURIER_CHAT_ID' }
    })

    if (!setting) {
      console.log('❌ Настройка COURIER_CHAT_ID не найдена')
      return
    }

    console.log('📱 COURIER_CHAT_ID:', setting.value)

    try {
      const chatIds = JSON.parse(setting.value)
      const courierIds = Object.keys(chatIds)

      console.log(`\n👥 Зарегистрировано курьеров: ${courierIds.length}`)

      if (courierIds.length > 0) {
        console.log('\n📝 Список зарегистрированных курьеров:')
        
        for (const courierId of courierIds) {
          const courier = await prisma.user.findUnique({
            where: { id: courierId }
          })

          if (courier) {
            console.log(`✅ ${courier.fullname} (${courier.phoneNumber})`)
            console.log(`   CourierID: ${courierId}`)
            console.log(`   ChatID: ${chatIds[courierId]}`)
          } else {
            console.log(`❌ Курьер с ID ${courierId} не найден в базе`)
          }
        }
      }

    } catch (parseError) {
      console.log('❌ Ошибка парсинга JSON:', parseError.message)
    }

  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRegistrations()
