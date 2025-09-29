'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CourierLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/courier/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, password })
      })

      const data = await response.json()

      if (data.success) {
        console.log('Авторизация успешна, перенаправление...')
        // Используем роутер Next.js для перенаправления
        router.push('/courier/dashboard')
      } else {
        setError(data.error || 'Ошибка входа')
      }
    } catch (error) {
      setError('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}>
      {/* Декоративный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white" style={{ background: 'linear-gradient(to bottom right, #fff7ed, #ffffff)' }}></div>
      
      {/* Основной контент */}
      <div className="relative flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          
          {/* Заголовок */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
              Вход в систему
            </h1>
            <p className="text-lg" style={{ color: '#6b7280' }}>
              Добро пожаловать! Мы вас ждали
            </p>
          </div>

          {/* Форма входа */}
          <div className="rounded-lg shadow-md p-8" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Ошибки */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Поле номера телефона */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Номер телефона
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+996555123456"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderColor: '#d1d5db',
                    color: '#1a1a1a'
                  }}
                />
              </div>

              {/* Поле пароля */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    className="w-full px-3 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    style={{ 
                      backgroundColor: '#ffffff',
                      borderColor: '#d1d5db',
                      color: '#1a1a1a'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                    style={{ color: '#9ca3af' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Кнопка входа */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-lg font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isLoading ? '#d1d5db' : '#ff6b35',
                  color: '#ffffff',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#e55a2b'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#ff6b35'
                  }
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Вход...
                  </div>
                ) : (
                  'Войти'
                )}
              </button>


            </form>
          </div>


        </div>
      </div>
    </div>
  )
}
