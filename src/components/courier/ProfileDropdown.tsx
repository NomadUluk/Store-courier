'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  UserIcon, 
  KeyIcon, 
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface ProfileDropdownProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
}

export function ProfileDropdown({ isOpen, onClose, anchorRef }: ProfileDropdownProps) {
  const { t } = useLanguage()
  const [activeView, setActiveView] = useState<'main' | 'profile' | 'password' | 'phone'>('main')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Загрузка данных профиля
  useEffect(() => {
    if (isOpen && !name) {
      fetchProfile()
    }
  }, [isOpen, name])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/courier/profile')
      const data = await response.json()
      
      if (data.success) {
        setName(data.data.fullname || '')
        setPhone(data.data.phoneNumber || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Сбрасываем вид при открытии
      setActiveView('main')
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  const handleProfileUpdate = async () => {
    if (!name.trim()) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/courier/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullname: name.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Можно добавить уведомление об успехе
        console.log('Имя обновлено')
      } else {
        alert(data.error || 'Ошибка при обновлении имени')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Ошибка при обновлении имени')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhoneUpdate = async () => {
    if (!newPhone.trim()) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/courier/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: newPhone.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPhone(newPhone.trim())
        setNewPhone('')
        console.log('Телефон обновлен')
      } else {
        alert(data.error || 'Ошибка при обновлении телефона')
      }
    } catch (error) {
      console.error('Error updating phone:', error)
      alert('Ошибка при обновлении телефона')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert(t('passwordMismatch') || 'Пароли не совпадают')
      return
    }
    console.log('Updating password')
    onClose()
  }


  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-[9999] border"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)'
      }}
    >
      {activeView === 'main' && (
        <div className="p-4">
          {/* Заголовок */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {t('yourProfile') || 'Ваш профиль'}
            </h3>
          </div>

          {isLoading && (
            <div className="text-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800 mx-auto"></div>
              <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{t('loadingData') || 'Загрузка данных...'}</p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Информация о профиле */}
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      {t('name')}
                    </label>
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {name || t('notSpecified') || 'Не указано'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      {t('phone')}
                    </label>
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {phone || t('notSpecified') || 'Не указан'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}


          {/* Меню опций */}
          {!isLoading && (
            <div className="space-y-2">
            <button
              onClick={() => setActiveView('profile')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                <span style={{ color: 'var(--foreground)' }}>{t('editProfile') || 'Редактировать профиль'}</span>
              </div>
              <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>

            <button
              onClick={() => setActiveView('password')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <KeyIcon className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                <span style={{ color: 'var(--foreground)' }}>{t('changePassword') || 'Изменить пароль'}</span>
              </div>
              <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
            </div>
          )}
        </div>
      )}

      {activeView === 'profile' && (
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => setActiveView('main')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" style={{ color: 'var(--muted)' }} />
            </button>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('editProfile') || 'Редактировать профиль'}
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('name') || 'Новое имя'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder={t('enterNewName') || 'Введите новое имя'}
              />
              <button
                onClick={handleProfileUpdate}
                disabled={isSaving || !name.trim()}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSaving ? (t('saving') || 'Сохранение...') : (t('save') || 'Сохранить')}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('newPhone') || 'Новый телефон'}
              </label>
              <div className="flex">
                <select className="px-3 py-2 border rounded-l-lg" style={{ borderColor: 'var(--border)' }}>
                  <option>+996</option>
                  <option>+7</option>
                </select>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="input-field flex-1 rounded-l-none"
                  placeholder={t('enterPhone') || 'Введите номер телефона'}
                />
              </div>
              <button
                onClick={handlePhoneUpdate}
                disabled={isSaving || !newPhone.trim()}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSaving ? (t('saving') || 'Сохранение...') : (t('save') || 'Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}


      {activeView === 'password' && (
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => setActiveView('main')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" style={{ color: 'var(--muted)' }} />
            </button>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {t('changePassword') || 'Изменить пароль'}
            </h3>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('currentPassword') || 'Текущий пароль'}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field w-full"
                placeholder={t('enterCurrentPassword') || 'Введите текущий пароль'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('newPassword') || 'Новый пароль'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field w-full"
                placeholder={t('enterNewPassword') || 'Введите новый пароль'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('confirmPassword') || 'Подтвердите пароль'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field w-full"
                placeholder={t('confirmNewPassword') || 'Подтвердите новый пароль'}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-800 text-white py-2.5 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              {t('update') || 'Обновить'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
