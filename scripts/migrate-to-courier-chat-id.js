const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateToCourierChatId() {
  try {
    console.log('🔄 Миграция с TELEGRAM_CHAT_ID на COURIER_CHAT_ID...')

    // Проверяем старое поле
    const oldSetting = await prisma.setting.findUnique({
      where: { key: 'TELEGRAM_CHAT_ID' }
    })

    // Проверяем новое поле
    const newSetting = await prisma.setting.findUnique({
      where: { key: 'COURIER_CHAT_ID' }
    })

    let dataToMigrate = '{}'
    
    if (oldSetting && oldSetting.value && oldSetting.value !== '{}') {
      console.log('📋 Найдены данные в старом поле TELEGRAM_CHAT_ID:', oldSetting.value)
      dataToMigrate = oldSetting.value
    }

    if (newSetting) {
      console.log('📋 Поле COURIER_CHAT_ID уже существует:', newSetting.value)
      
      // Если в новом поле уже есть данные, объединяем
      if (newSetting.value && newSetting.value !== '{}') {
        try {
          const oldData = JSON.parse(dataToMigrate)
          const newData = JSON.parse(newSetting.value)
          const mergedData = { ...oldData, ...newData }
          dataToMigrate = JSON.stringify(mergedData)
          console.log('🔀 Объединяем данные из старого и нового полей')
        } catch (e) {
          console.log('⚠️ Ошибка объединения данных, используем новые данные')
        }
      }

      // Обновляем существующую запись
      await prisma.setting.update({
        where: { key: 'COURIER_CHAT_ID' },
        data: { value: dataToMigrate }
      })
      console.log('✅ Поле COURIER_CHAT_ID обновлено')
    } else {
      // Создаем новую запись
      await prisma.setting.create({
        data: {
          key: 'COURIER_CHAT_ID',
          value: dataToMigrate
        }
      })
      console.log('✅ Создано новое поле COURIER_CHAT_ID')
    }

    // Показываем итоговые данные
    const finalSetting = await prisma.setting.findUnique({
      where: { key: 'COURIER_CHAT_ID' }
    })

    console.log('\n📊 Итоговые данные в COURIER_CHAT_ID:', finalSetting.value)

    try {
      const chatIds = JSON.parse(finalSetting.value)
      const courierIds = Object.keys(chatIds)
      console.log(`👥 Зарегистрировано курьеров: ${courierIds.length}`)
      
      if (courierIds.length > 0) {
        console.log('\n📝 Список:')
        for (const courierId of courierIds) {
          const courier = await prisma.user.findUnique({
            where: { id: courierId }
          })
          if (courier) {
            console.log(`  - ${courier.fullname} (${courier.phoneNumber}): ${chatIds[courierId]}`)
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Данные не в формате JSON')
    }

    console.log('\n🎉 Миграция завершена!')
    
    if (oldSetting && oldSetting.value !== '{}') {
      console.log('\n💡 Рекомендация: После проверки можно удалить старое поле TELEGRAM_CHAT_ID')
    }

  } catch (error) {
    console.error('❌ Ошибка миграции:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateToCourierChatId()
