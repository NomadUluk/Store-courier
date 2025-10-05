import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewOrderNotification } from '@/lib/telegram'
import type { ApiResponse } from '@/types'

// Кэш для отслеживания отправленных уведомлений (ID заказа -> timestamp)
const notificationCache = new Map<string, number>()
const NOTIFICATION_COOLDOWN = 120000 // 120 секунд (2 минуты) cooldown между уведомлениями для одного заказа

// Очистка старых записей из кэша каждые 5 минут
setInterval(() => {
  const now = Date.now()
  for (const [orderId, timestamp] of notificationCache.entries()) {
    if (now - timestamp > NOTIFICATION_COOLDOWN * 2) { // Удаляем записи старше 4 минут
      notificationCache.delete(orderId)
      console.log(`🧹 Удален из кэша заказ: ${orderId.slice(-8)}`)
    }
  }
}, 300000) // 5 минут

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId }: { orderId: string } = body

    console.log('API: Получен запрос на уведомление о новом заказе:', orderId)

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Order ID не предоставлен'
      }, { status: 400 })
    }

    // Проверяем, не отправляли ли мы уже уведомление для этого заказа недавно
    const lastNotificationTime = notificationCache.get(orderId)
    if (lastNotificationTime) {
      const timeSinceLastNotification = Date.now() - lastNotificationTime
      if (timeSinceLastNotification < NOTIFICATION_COOLDOWN) {
        console.log(`⏸️ API: Уведомление для заказа ${orderId.slice(-8)} уже было отправлено ${Math.round(timeSinceLastNotification / 1000)} секунд назад. Пропускаем.`)
        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'Уведомление уже было отправлено недавно'
        })
      } else {
        console.log(`⏰ API: Cooldown истек для заказа ${orderId.slice(-8)} (прошло ${Math.round(timeSinceLastNotification / 1000)} секунд), разрешаем повторную отправку`)
      }
    } else {
      console.log(`✨ API: Первое уведомление для заказа ${orderId.slice(-8)}`)
    }

    // Получаем заказ из базы данных
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        courier: true,
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                seller: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      console.log('API: Заказ не найден:', orderId)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Заказ не найден'
      }, { status: 404 })
    }

    console.log('API: Заказ найден:', { id: order.id, status: order.status, customer: order.customerName })

    // Проверяем, что заказ имеет статус COURIER_WAIT
    if (order.status !== 'COURIER_WAIT') {
      console.log('API: Заказ не имеет статус COURIER_WAIT:', order.status)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Заказ не имеет статус COURIER_WAIT'
      }, { status: 400 })
    }

    console.log('API: Отправляем уведомление в Telegram для заказа:', order.id)
    
    try {
      // Отправляем уведомление в Telegram с таймаутом
      await sendNewOrderNotification(order)
      console.log('API: Уведомление отправлено успешно')
      
      // Сохраняем timestamp отправки в кэш
      const timestamp = Date.now()
      notificationCache.set(orderId, timestamp)
      console.log(`API: Timestamp уведомления сохранен в кэш для заказа ${orderId.slice(-8)}, размер кэша: ${notificationCache.size}`)
    } catch (telegramError) {
      console.error('API: Ошибка отправки Telegram уведомления:', telegramError)
      // Не прерываем выполнение, просто логируем ошибку
      // Возвращаем успех, так как основная задача (отслеживание заказов) выполнена
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Уведомление о новом заказе отправлено'
    })
  } catch (error) {
    console.error('Notify new order error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при отправке уведомления о новом заказе'
    }, { status: 500 })
  }
}
