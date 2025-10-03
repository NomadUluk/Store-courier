import { NextRequest, NextResponse } from 'next/server'
import { startTelegramPolling, stopTelegramPolling, isTelegramPollingActive } from '@/lib/telegram-polling'
import type { ApiResponse } from '@/types'

// Автоматический запуск бота при первом запросе
let isAutoStarted = false

export async function GET(request: NextRequest) {
  try {
    if (!isAutoStarted) {
      console.log('🚀 Автоматический запуск Telegram бота...')
      await startTelegramPolling()
      isAutoStarted = true
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Telegram бот статус',
      data: {
        isActive: isTelegramPollingActive(),
        isAutoStarted
      }
    })
  } catch (error) {
    console.error('Auto-start error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при автозапуске бота'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'start') {
      await startTelegramPolling()
      isAutoStarted = true
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Telegram бот запущен'
      })
    } else if (action === 'stop') {
      await stopTelegramPolling()
      isAutoStarted = false
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Telegram бот остановлен'
      })
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Неизвестное действие'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Control bot error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при управлении ботом'
    }, { status: 500 })
  }
}
