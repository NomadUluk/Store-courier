'use client'

import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { SimpleThemeToggle } from '@/components/ui/SimpleThemeToggle'
import { SimpleLanguageToggle } from '@/components/ui/SimpleLanguageToggle'
import { TruckIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useState, useRef } from 'react'
import { ProfileDropdown } from '@/components/courier/ProfileDropdown'

function CourierLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  
  // Для страницы логина не показываем навигацию
  if (pathname === '/courier/login') {
    return <>{children}</>
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--secondary)' }}>
      {/* Навигационная панель */}
      <nav style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--border)' }} className="shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Логотип */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Store<span className="text-primary">Courier</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Переключатель языка */}
              <SimpleLanguageToggle />
              
              {/* Переключатель темы */}
              <SimpleThemeToggle />


              {/* Профиль курьера */}
              <div className="relative">
                <button 
                  ref={profileButtonRef}
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                >
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{t('courier')}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('activeStatus')}</p>
                </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                </button>

                <ProfileDropdown 
                  isOpen={isProfileDropdownOpen}
                  onClose={() => setIsProfileDropdownOpen(false)}
                  anchorRef={profileButtonRef}
                />
              </div>

              {/* Выход */}
              <button
                onClick={async () => {
                  await fetch('/api/courier/auth/logout', { method: 'POST' })
                  window.location.href = '/courier/login'
                }}
                className="btn-secondary text-sm px-4 py-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  )
}

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CourierLayoutWrapper>
      {children}
    </CourierLayoutWrapper>
  )
}

function CourierLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Для страницы логина не применяем тему - только языковой контекст
  if (pathname === '/courier/login') {
    return (
      <LanguageProvider>
        <CourierLayoutContent>
          {children}
        </CourierLayoutContent>
      </LanguageProvider>
    )
  }

  // Для остальных страниц применяем и тему, и язык
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CourierLayoutContent>
          {children}
        </CourierLayoutContent>
      </LanguageProvider>
    </ThemeProvider>
  )
}
