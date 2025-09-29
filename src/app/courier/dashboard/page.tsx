'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<TabType>('available')
  
  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState({
    available: 1,
    my: 1,
    completed: 1,
    canceled: 1
  })
  const ORDERS_PER_PAGE = 8

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    
    try {
      console.log('Загрузка заказов...')
      const response = await fetch('/api/courier/orders')
      
      console.log('Ответ сервера:', response.status, response.statusText)
      
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
      console.log('Данные заказов:', data)

      if (data.success) {
        setOrders(data.data || [])
        setLastUpdate(new Date())
        setError('')
        console.log('Заказы загружены успешно:', data.data?.length || 0)
      } else {
        setError(data.error || t('error'))
        console.error('Ошибка API:', data.error)
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      setError(t('connectionError') || 'Ошибка подключения к серверу')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

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

  // Автоматическое обновление каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false) // Обновляем без показа loading
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchOrders])

  // Группируем заказы по статусам
  // Доступные заказы - только те, что админ подтвердил (COURIER_WAIT) и еще не назначены
  const availableOrders = orders.filter(order => 
    order.status === 'COURIER_WAIT' && !order.courierId
  )
  
  // Мои заказы - те, что я принял в работу  
  const myOrders = orders.filter(order => 
    order.courierId && ['COURIER_PICKED', 'ENROUTE'].includes(order.status)
  )
  
  // Завершенные заказы - те, что я доставил
  const completedOrders = orders.filter(order => 
    order.status === 'DELIVERED' && order.courierId
  )
  
  // Отмененные заказы - те, что были отменены с комментарием
  const canceledOrders = orders.filter(order => 
    order.status === 'CANCELED'
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
    <div className="flex-1 w-full h-full px-4 py-6 overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
      <div className="space-y-4">
        {/* Заголовок и статистика */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          {/* Заголовок */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>{t('courierPanel')}</h1>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>
              {t('manageOrders')}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('updated')}: {lastUpdate.toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })} • {t('autoUpdate')}
              </span>
            </div>
          </div>

          {/* Быстрая статистика */}
          <div className="card stat-card p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center border border-yellow-200">
                <ClockIcon className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-primary">{availableOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('available')}</div>
          </div>
          
          <div className="card stat-card p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                <BoltIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-blue-600">{myOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('inWork')}</div>
          </div>
          
          <div className="card stat-card p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-green-600">{completedOrders.length}</div>
            <div className="text-x font-medium" style={{ color: 'var(--muted)' }}>{t('delivered')}</div>
          </div>
          
          <div className="card stat-card p-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
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
