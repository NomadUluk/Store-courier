import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Тестируем подключение к базе данных
    // Получаем количество записей в каждой таблице (если база данных пуста, вернется 0)
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()

    return NextResponse.json({
      success: true,
      message: 'Prisma подключен успешно!',
      data: {
        users: userCount,
        categories: categoryCount,
        products: productCount,
        orders: orderCount,
      },
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка подключения к базе данных',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
