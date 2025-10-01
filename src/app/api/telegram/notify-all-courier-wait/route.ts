import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewOrderNotification } from '@/lib/telegram'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('API: Получен запрос на уведомление о всех заказах COURIER_WAIT')

    // Получаем все заказы со статусом COURIER_WAIT
    const orders = await prisma.order.findMany({
      where: { status: 'COURIER_WAIT' },
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

    console.log('API: Найдено заказов COURIER_WAIT:', orders.length)

    if (orders.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Нет заказов со статусом COURIER_WAIT'
      })
    }

    // Отправляем уведомления для каждого заказа
    const results = []
    for (const order of orders) {
      try {
        console.log('API: Отправляем уведомление для заказа:', order.id)
        await sendNewOrderNotification(order)
        results.push({ orderId: order.id, success: true })
      } catch (error) {
        console.error('API: Ошибка отправки уведомления для заказа:', order.id, error)
        results.push({ orderId: order.id, success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log('API: Результаты отправки:', { success: successCount, errors: errorCount })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Уведомления отправлены: ${successCount} успешно, ${errorCount} с ошибками`,
      data: { results, successCount, errorCount }
    })
  } catch (error) {
    console.error('Notify all courier wait error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при отправке уведомлений о заказах'
    }, { status: 500 })
  }
}

