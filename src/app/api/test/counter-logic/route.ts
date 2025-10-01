import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    console.log('Тестирование логики счетчика...')
    
    // Получаем текущий счетчик доступных заказов
    const availableCount = await prisma.order.count({
      where: {
        status: 'COURIER_WAIT',
        courierId: null
      }
    })
    
    // Получаем последние 5 последних доступных заказов
    const recentOrders = await prisma.order.findMany({
      where: {
        status: 'COURIER_WAIT',
        courierId: null
      },
      select: {
        id: true,
        customerName: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    console.log('Текущий счетчик доступных заказов:', availableCount)
    console.log('Последние доступные заказы:', recentOrders)
    
    return NextResponse.json<ApiResponse<{
      count: number,
      recentOrders: any[]
    }>>({
      success: true,
      data: {
        count: availableCount,
        recentOrders: recentOrders
      }
    })
  } catch (error) {
    console.error('Test counter logic error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при тестировании логики счетчика'
    }, { status: 500 })
  }
}
