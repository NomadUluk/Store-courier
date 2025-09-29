'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'

export function ThemeLanguageToggle() {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 space-y-4">
              
              {/* Переключатель темы */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('theme')}
                </label>
                <button
                  onClick={toggleTheme}
                  className="w-full mt-2 flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {theme === 'light' ? (
                      <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {theme === 'light' ? t('lightTheme') : t('darkTheme')}
                    </span>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-primary' : 'bg-gray-200'
                  } relative`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform absolute top-1 ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                </button>
              </div>

              {/* Переключатель языка */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('language')}
                </label>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                      language === 'ru' 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-sm">🇷🇺</span>
                    <span className="text-sm">{t('russian')}</span>
                    {language === 'ru' && (
                      <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setLanguage('ky')}
                    className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                      language === 'ky' 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-sm">🇰🇬</span>
                    <span className="text-sm">{t('kyrgyz')}</span>
                    {language === 'ky' && (
                      <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


