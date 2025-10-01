import { NextRequest, NextResponse } from 'next/server'
import { testTelegramBot } from '@/lib/telegram'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    console.log('API: Тестирование Telegram бота (GET)')
    
    await testTelegramBot()
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Telegram бот работает корректно'
    })
  } catch (error) {
    console.error('Test Telegram error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при тестировании Telegram бота'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Тестирование Telegram бота (POST)')
    
    await testTelegramBot()
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Telegram бот работает корректно'
    })
  } catch (error) {
    console.error('Test Telegram error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при тестировании Telegram бота'
    }, { status: 500 })
  }
}