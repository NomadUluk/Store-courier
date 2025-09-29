'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export function SimpleThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5" style={{ color: 'var(--muted)' }} />
      ) : (
        <SunIcon className="w-5 h-5" style={{ color: 'var(--muted)' }} />
      )}
    </button>
  )
}
