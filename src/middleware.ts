import { NextRequest, NextResponse } from 'next/server'

// Безопасный импорт инициализации сервера для автоматического запуска бота
if (typeof window === 'undefined') {
  import('@/lib/server-init').catch(console.error)
}

export function middleware(request: NextRequest) {
  console.log('Middleware: Проверка маршрута:', request.nextUrl.pathname)
  
  // Проверяем только маршруты курьеров (кроме страницы логина)
  if (request.nextUrl.pathname.startsWith('/courier') && 
      !request.nextUrl.pathname.startsWith('/courier/login')) {
    
    const token = request.cookies.get('auth-token')?.value
    console.log('Middleware: Токен найден:', !!token, token ? `Длина: ${token.length}` : 'Токен отсутствует')

    if (!token) {
      console.log('Middleware: Токен отсутствует, перенаправление на логин')
      return NextResponse.redirect(new URL('/courier/login', request.url))
    }

    // Для Edge Runtime мы просто проверяем наличие токена
    // Полная проверка JWT будет происходить в API роутах
    if (!token || token.length < 10) {
      console.error('Middleware: Недействительный токен, перенаправление на логин')
      const response = NextResponse.redirect(new URL('/courier/login', request.url))
      // Удаляем недействительный токен
      response.cookies.delete('auth-token')
      return response
    }
    
    console.log('Middleware: Токен действителен, разрешаем доступ')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/courier/:path*']
}
