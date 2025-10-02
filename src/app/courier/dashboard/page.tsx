'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompactOrderCard } from '@/components/courier/CompactOrderCard'
import { OrderDetailModal } from '@/components/courier/OrderDetailModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { ClockIcon, BoltIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import type { OrderWithDetails, OrderStatus } from '@/types'

type TabType = 'available' | 'my' | 'completed' | 'canceled'

export default function CourierDashboard() {
  console.log('CourierDashboard: Компонент загружается')
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<TabType>('available')
  const [currentCourierId, setCurrentCourierId] = useState<string | null>(null)
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set())
  const [previousAvailableCount, setPreviousAvailableCount] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown')
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  
  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState({
    available: 1,
    my: 1,
    completed: 1,
    canceled: 1
  })
  const ORDERS_PER_PAGE = 8

  // Функция для проверки счетчика и получения новых заказов
  const checkForNewOrders = useCallback(async () => {
    try {
      // Получаем текущий счетчик доступных заказов
      const countResponse = await fetch('/api/courier/orders/count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 секунд таймаут
      })
      
      if (!countResponse.ok) {
        console.error('Ошибка получения счетчика:', countResponse.status, countResponse.statusText)
        setConnectionStatus('disconnected')
        return
      }
      
      const countData = await countResponse.json()
      if (!countData.success) {
        console.error('Ошибка API счетчика:', countData.error)
        return
      }
      
      const currentCount = countData.data.count
      
      // Если счетчик увеличился - есть новые заказы
      if (currentCount > previousAvailableCount) {
        const newOrdersCount = currentCount - previousAvailableCount
        console.log(`🎯 Обнаружено ${newOrdersCount} новых заказов!`)
        
        // Получаем последние новые заказы
        const recentResponse = await fetch(`/api/courier/orders/recent?limit=${newOrdersCount}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        })
        
        if (!recentResponse.ok) {
          console.error('Ошибка получения новых заказов:', recentResponse.status, recentResponse.statusText)
          return
        }
        
        const recentData = await recentResponse.json()
        if (!recentData.success) {
          console.error('Ошибка API новых заказов:', recentData.error)
          return
        }
        
        const newOrders = recentData.data || []
        
        // Отправляем уведомления только для новых заказов
        newOrders.forEach(async (order: OrderWithDetails) => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут
            
            const response = await fetch('/api/telegram/notify-new-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ orderId: order.id }),
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (response.ok) {
              console.log('✅ Уведомление отправлено для заказа:', order.id.slice(-8))
            } else {
              console.error('❌ Ошибка отправки уведомления для заказа:', order.id.slice(-8), response.status)
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('⏰ Таймаут отправки уведомления для заказа:', order.id.slice(-8))
            } else {
              console.error('❌ Ошибка отправки уведомления:', error)
            }
          }
        })
      }
      
      // Обновляем счетчик
      setPreviousAvailableCount(currentCount)
      setConnectionStatus('connected')
      
    } catch (error) {
      console.error('Ошибка проверки новых заказов:', error)
      setConnectionStatus('disconnected')
      
      // Более детальная обработка ошибок
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('⏰ Таймаут при проверке новых заказов')
        } else if (error.message.includes('Failed to fetch')) {
          console.log('🌐 Проблема с подключением к серверу')
        } else {
          console.log('❌ Неизвестная ошибка:', error.message)
        }
      }
    }
  }, [previousAvailableCount])

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    
    try {
      const response = await fetch('/api/courier/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Добавляем таймаут для запроса
        signal: AbortSignal.timeout(10000) // 10 секунд таймаут
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Ошибка авторизации. Пожалуйста, войдите снова.')
          // Перенаправляем на страницу входа
          router.push('/courier/login')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()

      if (data.success) {
        const newOrders = data.data || []
        
        setOrders(newOrders)
        setPreviousOrderIds(new Set(newOrders.map((order: OrderWithDetails) => order.id)))
        setLastUpdate(new Date())
        setError('')
        setConnectionStatus('connected')
        
        // Инициализируем счетчик доступных заказов при первой загрузке
        if (showLoading) {
          const availableOrders = newOrders.filter((order: OrderWithDetails) => 
            order.status === 'COURIER_WAIT' && !order.courierId
          )
          setPreviousAvailableCount(availableOrders.length)
          setIsInitialized(true)
        }
      } else {
        setError(data.error || t('error'))
        console.error('Ошибка API:', data.error)
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      
      // Обрабатываем разные типы ошибок
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('⏰ Запрос был прерван (таймаут)')
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          console.log('🌐 Сервер недоступен - проверьте, что сервер запущен')
          setConnectionStatus('disconnected')
        } else {
          console.log('❌ Неизвестная ошибка:', error.message)
        }
      }
      
      // Обновляем статус подключения
      setConnectionStatus('disconnected')
      
      // Не показываем ошибку при автоматическом обновлении, только при первой загрузке
      if (showLoading) {
        setError('Ошибка подключения к серверу. Убедитесь, что сервер запущен на порту 3000.')
      }
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [router])

  const handleStatusUpdate = async (orderId: string, status: OrderStatus, cancelComment?: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/courier/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, cancelComment })
      })

      const data = await response.json()

      if (data.success) {
        // Обновляем заказ в списке
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, ...data.data }
              : order
          )
        )
        
        // Обновляем выбранный заказ если он открыт
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...data.data })
        }

        // Закрываем модальное окно
        setIsModalOpen(false)
        setSelectedOrder(null)

        // Переключаем на соответствующую вкладку в зависимости от статуса
        const getTargetTab = (newStatus: OrderStatus): TabType => {
          switch (newStatus) {
            case 'COURIER_PICKED':
            case 'ENROUTE':
              return 'my' // Мои заказы
            case 'DELIVERED':
              return 'completed' // Завершенные
            case 'CANCELED':
              return 'canceled' // Отмененные
            default:
              return 'available' // Доступные
          }
        }

        const targetTab = getTargetTab(status)
        if (targetTab !== activeTab) {
          setActiveTab(targetTab)
          // Сбрасываем пагинацию для новой вкладки
          setCurrentPage(prev => ({
            ...prev,
            [targetTab]: 1
          }))
        }

        // Обновляем данные заказов для корректного отображения
        await fetchOrders(false)
      } else {
        setError(data.error || t('error'))
      }
    } catch (error) {
      setError(t('error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOrderClick = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  useEffect(() => {
    // Проверяем токен перед загрузкой заказов
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/courier/auth/verify')
        if (!response.ok) {
          console.log('Токен недействителен, перенаправление на логин')
          // Очищаем токен и перенаправляем
          document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
          router.push('/courier/login')
          return
        }
        const data = await response.json()
        console.log('Токен действителен:', data)
        // Сохраняем ID текущего курьера
        if (data.success && data.data?.id) {
          setCurrentCourierId(data.data.id)
        }
        fetchOrders()
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
        // Очищаем токен и перенаправляем
        document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/courier/login')
      }
    }
    
    checkAuth()
  }, [fetchOrders, router])

  // Обработка URL параметров для перехода к заказу или вкладке
  useEffect(() => {
    if (orders.length > 0) {
      const orderId = searchParams.get('order')
      const tab = searchParams.get('tab')
      
      if (orderId) {
        // Найти заказ по ID и открыть модальное окно
        const order = orders.find(o => o.id === orderId)
        if (order) {
          setSelectedOrder(order)
          setIsModalOpen(true)
        }
      }
      
      if (tab && ['available', 'my', 'completed', 'canceled'].includes(tab)) {
        setActiveTab(tab as TabType)
      }
    }
  }, [orders, searchParams])

  // Автоматическое обновление каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInitialized) {
        // Сначала проверяем новые заказы
        checkForNewOrders()
        // Затем обновляем общий список заказов
        fetchOrders(false) // Обновляем без показа loading
      }
    }, 10000) // 10 секунд

    return () => clearInterval(interval)
  }, [fetchOrders, checkForNewOrders, isInitialized])

  // Группируем заказы по статусам
  // Доступные заказы - только те, что админ подтвердил (COURIER_WAIT) и еще не назначены
  const availableOrders = orders.filter(order => 
    order.status === 'COURIER_WAIT' && !order.courierId
  )
  
  // Мои заказы - те, что я принял в работу (только мои заказы)
  // Сортируем так, чтобы заказы "В пути" (ENROUTE) были в начале списка
  const myOrders = orders
    .filter(order => 
      order.courierId === currentCourierId && ['COURIER_PICKED', 'ENROUTE'].includes(order.status)
    )
    .sort((a, b) => {
      // Заказы "В пути" (ENROUTE) показываем первыми
      if (a.status === 'ENROUTE' && b.status !== 'ENROUTE') return -1
      if (b.status === 'ENROUTE' && a.status !== 'ENROUTE') return 1
      // Для остальных заказов сортируем по дате создания (старые первыми)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  
  // Завершенные заказы - те, что я доставил (только мои заказы)
  const completedOrders = orders.filter(order => 
    order.status === 'DELIVERED' && order.courierId === currentCourierId
  )
  
  // Отмененные заказы - те, что были отменены (только мои заказы)
  const canceledOrders = orders.filter(order => 
    order.status === 'CANCELED' && order.courierId === currentCourierId
  )

  // Функции для пагинации
  const getPaginatedOrders = (ordersList: OrderWithDetails[], tabType: TabType) => {
    const page = currentPage[tabType]
    const startIndex = (page - 1) * ORDERS_PER_PAGE
    const endIndex = startIndex + ORDERS_PER_PAGE
    return ordersList.slice(startIndex, endIndex)
  }

  const getTotalPages = (ordersList: OrderWithDetails[]) => {
    return Math.ceil(ordersList.length / ORDERS_PER_PAGE)
  }

  const handlePageChange = (tabType: TabType, page: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [tabType]: page
    }))
  }

  // Получаем текущие заказы для отображения
  const currentAvailableOrders = getPaginatedOrders(availableOrders, 'available')
  const currentMyOrders = getPaginatedOrders(myOrders, 'my')
  const currentCompletedOrders = getPaginatedOrders(completedOrders, 'completed')
  const currentCanceledOrders = getPaginatedOrders(canceledOrders, 'canceled')

  // Компонент пагинации
  const PaginationComponent = ({ 
    totalItems, 
    currentPageNum, 
    tabType 
  }: { 
    totalItems: number; 
    currentPageNum: number; 
    tabType: TabType 
  }) => {
    const totalPages = getTotalPages(Array(totalItems).fill(null))
    
    if (totalPages <= 1) return null
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(tabType, Math.max(1, currentPageNum - 1))}
          disabled={currentPageNum === 1}
          className={`px-3 py-1 rounded ${
            currentPageNum === 1 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          ←
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(tabType, page)}
            className={`px-3 py-1 rounded ${
              page === currentPageNum
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(tabType, Math.min(totalPages, currentPageNum + 1))}
          disabled={currentPageNum === totalPages}
          className={`px-3 py-1 rounded ${
            currentPageNum === totalPages 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          →
        </button>
        
        <span className="text-sm text-gray-600 ml-4">
          Стр. {currentPageNum} из {totalPages} ({totalItems} всего)
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full h-full px-4 py-3 overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
      <div className="space-y-3">
        {/* Заголовок и статистика */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 mb-3">
          {/* Заголовок */}
          <div className="lg:col-span-2">
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>{t('courierPanel')}</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {t('manageOrders')}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500 animate-pulse' 
                  : connectionStatus === 'disconnected'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('updated')}: {lastUpdate.toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })} • Обновление каждые 10 сек
              </span>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                Счетчик: {previousAvailableCount}
              </span>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test/connection')
                    const data = await response.json()
                    console.log('Тест подключения:', data)
                    alert(`Подключение: ${data.success ? '✅ OK' : '❌ Ошибка'}`)
                  } catch (error) {
                    console.error('Ошибка теста:', error)
                    alert('❌ Сервер недоступен')
                  }
                }}
                className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
              >
                🔧 Тест
              </button>
              <span className={`text-xs px-2 py-1 rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-600' 
                  : connectionStatus === 'disconnected'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {connectionStatus === 'connected' ? 'Подключено' : 
                 connectionStatus === 'disconnected' ? 'Отключено' : 'Проверка...'}
              </span>
            </div>
          </div>

          {/* Быстрая статистика */}
          <div 
            className={`card stat-card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
              activeTab === 'available' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
            }`}
            onClick={() => setActiveTab('available')}
          >
            <div className="flex items-center justify-center mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                activeTab === 'available' 
                  ? 'bg-yellow-200 border-yellow-400' 
                  : 'bg-yellow-100 border-yellow-200'
              }`}>
                <ClockIcon className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-primary">{availableOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('available')}</div>
          </div>
          
          <div 
            className={`card stat-card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
              activeTab === 'my' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setActiveTab('my')}
          >
            <div className="flex items-center justify-center mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                activeTab === 'my' 
                  ? 'bg-blue-200 border-blue-400' 
                  : 'bg-blue-100 border-blue-200'
              }`}>
                <BoltIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-blue-600">{myOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('inWork')}</div>
          </div>
          
          <div 
            className={`card stat-card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
              activeTab === 'completed' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
            onClick={() => setActiveTab('completed')}
          >
            <div className="flex items-center justify-center mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                activeTab === 'completed' 
                  ? 'bg-green-200 border-green-400' 
                  : 'bg-green-100 border-green-200'
              }`}>
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-green-600">{completedOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('delivered')}</div>
          </div>
          
          <div 
            className={`card stat-card p-4 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
              activeTab === 'canceled' ? 'ring-2 ring-red-500 bg-red-50' : ''
            }`}
            onClick={() => setActiveTab('canceled')}
          >
            <div className="flex items-center justify-center mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                activeTab === 'canceled' 
                  ? 'bg-red-200 border-red-400' 
                  : 'bg-red-100 border-red-200'
              }`}>
                <XCircleIcon className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-red-600">{canceledOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('canceled')}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}


        {/* Вкладки заказов */}
        <section className="space-y-4">
          {/* Навигация по вкладкам */}
          <div className="card p-1">
            <div className="flex">
              <button
                onClick={() => setActiveTab('available')}
                className={`tab-button flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'available'
                    ? 'bg-yellow-500 text-white shadow-md border-yellow-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200'
                }`}
              >
                <ClockIcon className="w-5 h-5" />
                <span className="font-medium">{t('availableOrders')}</span>
              </button>
              
              <button
                onClick={() => setActiveTab('my')}
                className={`tab-button flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'my'
                    ? 'bg-blue-500 text-white shadow-md border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200'
                }`}
              >
                <BoltIcon className="w-5 h-5" />
                <span className="font-medium">{t('myOrders')}</span>
              </button>
              
              <button
                onClick={() => setActiveTab('completed')}
                className={`tab-button flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'completed'
                    ? 'bg-green-500 text-white shadow-md border-green-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200'
                }`}
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium">{t('completedOrders')}</span>
              </button>
              
              <button
                onClick={() => setActiveTab('canceled')}
                className={`tab-button flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === 'canceled'
                    ? 'bg-red-500 text-white shadow-md border-red-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200'
                }`}
              >
                <XCircleIcon className="w-5 h-5" />
                <span className="font-medium">{t('canceledOrders')}</span>
              </button>
            </div>
          </div>

          {/* Содержимое вкладок */}
          <div>
            {/* Доступные заказы */}
            {activeTab === 'available' && (
            <div>
              {availableOrders.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentAvailableOrders.map((order) => (
                      <CompactOrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))}
                  </div>
                  <PaginationComponent 
                    totalItems={availableOrders.length}
                    currentPageNum={currentPage.available}
                    tabType="available"
                  />
                </>
              ) : (
                <div className="card p-12 text-center">
                  <ClockIcon className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                  <p className="text-lg" style={{ color: 'var(--muted)' }}>{t('noAvailableOrders')}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{t('newOrdersHere')}</p>
                </div>
              )}
            </div>
          )}

          {/* Мои заказы */}
          {activeTab === 'my' && (
            <div>
              {myOrders.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentMyOrders.map((order) => (
                      <CompactOrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))}
                  </div>
                  <PaginationComponent 
                    totalItems={myOrders.length}
                    currentPageNum={currentPage.my}
                    tabType="my"
                  />
                </>
              ) : (
                <div className="card p-12 text-center">
                  <BoltIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <p className="text-lg" style={{ color: 'var(--muted)' }}>{t('noActiveOrders')}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{t('acceptFromAvailable')}</p>
                </div>
              )}
            </div>
          )}

          {/* Завершенные заказы */}
          {activeTab === 'completed' && (
            <div>
              {completedOrders.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentCompletedOrders.map((order) => (
                      <CompactOrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))}
                  </div>
                  <PaginationComponent 
                    totalItems={completedOrders.length}
                    currentPageNum={currentPage.completed}
                    tabType="completed"
                  />
                </>
              ) : (
                <div className="card p-12 text-center">
                  <CheckCircleIcon className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <p className="text-lg" style={{ color: 'var(--muted)' }}>{t('noCompletedOrders') || 'Завершенных заказов пока нет'}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{t('completedOrdersHere') || 'Завершенные заказы будут отображаться здесь'}</p>
                </div>
              )}
            </div>
          )}

          {/* Отмененные заказы */}
          {activeTab === 'canceled' && (
            <div>
              {canceledOrders.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentCanceledOrders.map((order) => (
                      <CompactOrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                      />
                    ))}
                  </div>
                  <PaginationComponent 
                    totalItems={canceledOrders.length}
                    currentPageNum={currentPage.canceled}
                    tabType="canceled"
                  />
                </>
              ) : (
                <div className="card p-12 text-center">
                  <XCircleIcon className="w-16 h-16 text-red-300 mx-auto mb-4" />
                  <p className="text-lg" style={{ color: 'var(--muted)' }}>{t('noCanceledOrders') || 'Отмененных заказов пока нет'}</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{t('canceledOrdersHere') || 'Отмененные заказы будут отображаться здесь'}</p>
                </div>
              )}
            </div>
          )}
          </div>
        </section>

        {/* Модальное окно с деталями заказа */}
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  )
}
