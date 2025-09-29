import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export async function POST() {
  const response = NextResponse.json<ApiResponse>({
    success: true,
    message: 'Успешный выход из системы'
  })

  // Удаляем cookie с токеном
  response.cookies.delete('auth-token')

  return response
}


