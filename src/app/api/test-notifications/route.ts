import { NextRequest, NextResponse } from 'next/server'
import { sendNotification, getCacheStats } from '@/lib/notification-manager'
import type { ApiResponse } from '@/types'

// GET - Тест централизованной системы уведомлений
export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats()
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Централизованная система уведомлений работает',
      data: {
        cacheStats: stats,
        endpoints: {
          single: 'POST /api/notifications - отправка одного уведомления',
          bulk: 'PUT /api/notifications - массовая отправка уведомлений',
          stats: 'GET /api/notifications - статистика кэша',
          clear: 'DELETE /api/notifications - очистка кэша'
        },
        notificationTypes: ['NEW_ORDER', 'STATUS_UPDATE', 'ORDER_CANCELLED'],
        features: [
          'Дедупликация через cookies',
          'Кэширование в памяти',
          'Cooldown 5 минут',
          'Массовая отправка',
          'Статистика и мониторинг'
        ]
      }
    })
  } catch (error) {
    console.error('Test notification system error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при тестировании системы уведомлений'
    }, { status: 500 })
  }
}

// POST - Тест отправки уведомления
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, type } = body
    
    if (!orderId || !type) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'orderId и type обязательны для теста'
      }, { status: 400 })
    }
    
    console.log('🧪 Тест отправки уведомления:', { orderId: orderId?.slice(-8), type })
    
    const result = await sendNotification(request, {
      orderId,
      type,
      oldStatus: 'CREATED' // Для теста
    })
    
    const response = NextResponse.json<ApiResponse>({
      success: result.success,
      message: `Тест завершен: ${result.message}`,
      data: {
        result,
        cacheStats: getCacheStats()
      }
    })
    
    // Устанавливаем cookie для теста
    if (result.success && !result.duplicate) {
      const notificationKey = `${result.orderId}_${result.type}`
      const cookieName = `notification_${notificationKey}`
      const timestamp = result.timestamp.toString()
      
      response.cookies.set(cookieName, timestamp, {
        maxAge: 300, // 5 минут
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
    }
    
    return response
    
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при тестировании уведомления'
    }, { status: 500 })
  }
}
