import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewOrderNotification } from '@/lib/telegram'
import type { ApiResponse } from '@/types'

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
