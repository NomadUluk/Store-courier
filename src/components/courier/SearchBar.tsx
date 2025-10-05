'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'

interface SearchBarProps {
  onSearchChange?: (value: string) => void
}

export function SearchBar({ onSearchChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const { t } = useLanguage()

  // Показываем только на странице dashboard
  if (pathname !== '/courier/dashboard') {
    return null
  }

  const handleChange = (value: string) => {
    setSearchQuery(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
    // Отправляем событие для dashboard
    window.dispatchEvent(new CustomEvent('searchQueryChange', { detail: value }))
  }

  return (
    <div className="hidden lg:block">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t('searchOrders') || 'Поиск заказов...'}
          value={searchQuery}
          onChange={(e) => handleChange(e.target.value)}
          className="w-64 xl:w-80 pl-9 pr-9 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => handleChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

