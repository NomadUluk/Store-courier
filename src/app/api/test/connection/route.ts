import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    console.log('API: Тест подключения')
    
    return NextResponse.json<ApiResponse<{ 
      status: string, 
      timestamp: string,
      server: string 
    }>>({
      success: true,
      data: {
        status: 'connected',
        timestamp: new Date().toISOString(),
        server: 'Next.js API'
      }
    })
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка тестирования подключения'
    }, { status: 500 })
  }
}
