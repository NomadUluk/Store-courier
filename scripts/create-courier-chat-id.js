const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createCourierChatId() {
  try {
    console.log('🔧 Создание поля COURIER_CHAT_ID...')

    // Проверяем старое поле
    const oldSetting = await prisma.setting.findUnique({
      where: { key: 'TELEGRAM_CHAT_ID' }
    })

    let dataToSave = '{}'
    if (oldSetting && oldSetting.value) {
      console.log('📋 Найдены данные в TELEGRAM_CHAT_ID:', oldSetting.value)
      dataToSave = oldSetting.value
    }

    // Создаем новое поле
    const newSetting = await prisma.setting.upsert({
      where: { key: 'COURIER_CHAT_ID' },
      update: { value: dataToSave },
      create: { 
        key: 'COURIER_CHAT_ID', 
        value: dataToSave 
      }
    })

    console.log('✅ Поле COURIER_CHAT_ID создано/обновлено')
    console.log('📋 Значение:', newSetting.value)

    // Показываем зарегистрированных курьеров
    try {
      const chatIds = JSON.parse(newSetting.value)
      const courierIds = Object.keys(chatIds)
      console.log(`👥 Зарегистрировано курьеров: ${courierIds.length}`)
      
      if (courierIds.length > 0) {
        console.log('\n📝 Список:')
        for (const courierId of courierIds) {
          const courier = await prisma.user.findUnique({
            where: { id: courierId }
          })
          if (courier) {
            console.log(`  ✅ ${courier.fullname} (${courier.phoneNumber})`)
            console.log(`     CourierID: ${courierId}`)
            console.log(`     ChatID: ${chatIds[courierId]}`)
          } else {
            console.log(`  ❌ Курьер с ID ${courierId} не найден`)
          }
        }
      }
    } catch (e) {
      console.log('ℹ️ Пустой JSON объект - курьеры не зарегистрированы')
    }

    console.log('\n🎉 Готово!')

  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCourierChatId()
