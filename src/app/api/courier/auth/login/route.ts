import { NextRequest, NextResponse } from 'next/server'
import { authenticateCourier, createToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, password } = body

    if (!phoneNumber || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Номер телефона и пароль обязательны'
      }, { status: 400 })
    }

    const user = await authenticateCourier(phoneNumber, password)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Неверный номер телефона или пароль'
      }, { status: 401 })
    }

    const token = createToken({
      id: user.id,
      phoneNumber: user.phoneNumber,
      fullname: user.fullname
    })

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          fullname: user.fullname,
          phoneNumber: user.phoneNumber,
          role: user.role
        }
      },
      message: 'Успешная авторизация'
    })

    // Устанавливаем cookie с токеном
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      path: '/' // Явно указываем путь
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Внутренняя ошибка сервера'
    }, { status: 500 })
  }
}

