'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompactOrderCard } from '@/components/courier/CompactOrderCard'
import { MobileOrderCard } from '@/components/courier/MobileOrderCard'
import { OrderDetailModal } from '@/components/courier/OrderDetailModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { CustomDropdown } from '@/components/ui/CustomDropdown'
import { ClockIcon, BoltIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, CalendarIcon, CurrencyDollarIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import type { OrderWithDetails, OrderStatus, OrderItem, Product, Category, User } from '@/types'

type TabType = 'available' | 'my' | 'completed' | 'canceled'
type SortType = 'date-new' | 'date-old' | 'price-high' | 'price-low' | 'items-high' | 'items-low'
type DateFilterType = 'all' | 'today' | 'yesterday' | 'week' | 'month'

export default function CourierDashboard() {
  console.log('CourierDashboard: Компонент загружается')
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Проверяем параметр noTelegram при загрузке
  useEffect(() => {
    const noTelegram = searchParams.get('noTelegram')
    if (noTelegram === 'true') {
      setShowTelegramNotification(true)
      // Очищаем параметр из URL
      const url = new URL(window.location.href)
      url.searchParams.delete('noTelegram')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])
  
  // Глобальная обработка ошибок расширений браузера
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message.includes('message channel closed') || 
          event.message.includes('asynchronous response')) {
        console.log('🔧 Игнорируем ошибку расширения браузера:', event.message)
        event.preventDefault()
        return false
      }
    }
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('message channel closed') ||
           event.reason.message.includes('asynchronous response'))) {
        console.log('🔧 Игнорируем ошибку расширения браузера:', event.reason.message)
        event.preventDefault()
        return false
      }
    }
    
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('available')
  const [currentCourierId, setCurrentCourierId] = useState<string | null>(null)
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set())
  const [previousAvailableCount, setPreviousAvailableCount] = useState<number>(0)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [notifiedOrderIds, setNotifiedOrderIds] = useState<Set<string>>(new Set()) // Отслеживаем заказы, для которых уже отправлены уведомления
  
  // Состояние для эффекта свечения карточек
  const [glowingOrders, setGlowingOrders] = useState<Set<string>>(new Set())
  
  // Состояние для уведомления о Telegram
  const [showTelegramNotification, setShowTelegramNotification] = useState(false)
  
  // Состояние для поиска
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Состояния для фильтров и сортировки
  const [sortBy, setSortBy] = useState<SortType>('date-new')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [itemsMin, setItemsMin] = useState<string>('')
  const [itemsMax, setItemsMax] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')

  // Состояние для определения размера экрана
  const [isMobile, setIsMobile] = useState(false)
  
  // Состояние для отслеживания недавнего изменения статуса
  const [recentStatusChange, setRecentStatusChange] = useState<boolean>(false)

  // Определяем размер экрана
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Опции для dropdown'ов
  const sortOptions = [
    { value: 'date-new', label: 'Сначала новые' },
    { value: 'date-old', label: 'Сначала старые' },
    { value: 'price-high', label: 'Цена: по убыванию' },
    { value: 'price-low', label: 'Цена: по возрастанию' },
    { value: 'items-high', label: 'Товаров: больше' },
    { value: 'items-low', label: 'Товаров: меньше' }
  ]

  const dateFilterOptions = [
    { value: 'all', label: 'Все время' },
    { value: 'today', label: 'Сегодня' },
    { value: 'yesterday', label: 'Вчера' },
    { value: 'week', label: 'За неделю' },
    { value: 'month', label: 'За месяц' }
  ]

  // Функция для рендеринга карточек заказов
  const renderOrderCard = (order: OrderWithDetails) => {
    const commonProps = {
      order,
      onClick: () => handleOrderClick(order),
      isGlowing: glowingOrders.has(order.id)
    }

    if (isMobile) {
      return <MobileOrderCard key={order.id} {...commonProps} />
    } else {
      return <CompactOrderCard key={order.id} {...commonProps} />
    }
  }

  // Слушаем события поиска из navbar
  useEffect(() => {
    const handleSearchChange = (event: CustomEvent) => {
      setSearchQuery(event.detail)
    }

    window.addEventListener('searchQueryChange', handleSearchChange as EventListener)

    return () => {
      window.removeEventListener('searchQueryChange', handleSearchChange as EventListener)
    }
  }, [])
  

  // Функция для добавления эффекта свечения к заказу
  const addGlowEffect = useCallback((orderId: string) => {
    setGlowingOrders(prev => new Set(prev).add(orderId))
    // Убираем эффект через 3 секунды
    setTimeout(() => {
      setGlowingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }, 3000)
  }, [])

  // Функция для отправки браузерных уведомлений
  const sendBrowserNotification = useCallback((title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'courier-notification',
        requireInteraction: false,
        silent: false
      })
    }
  }, [])

  // Запрос разрешения на уведомления при загрузке
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Разрешение на уведомления:', permission)
      })
    }
  }, [])

  // Функция для поиска заказа и определения нужной вкладки и страницы
  const findOrderLocation = useCallback((orderId: string) => {
    const availableOrders = orders.filter(order => order.status === 'COURIER_WAIT')
    const myOrders = orders.filter(order => 
      order.courierId === currentCourierId && 
      (order.status === 'COURIER_PICKED' || order.status === 'ENROUTE')
    )
    const completedOrders = orders.filter(order => order.status === 'DELIVERED')
    const canceledOrders = orders.filter(order => order.status === 'CANCELED')

    // Проверяем в каждой категории
    const categories = [
      { name: 'available' as TabType, orders: availableOrders },
      { name: 'my' as TabType, orders: myOrders },
      { name: 'completed' as TabType, orders: completedOrders },
      { name: 'canceled' as TabType, orders: canceledOrders }
    ]

    for (const category of categories) {
      const orderIndex = category.orders.findIndex(order => order.id === orderId)
      if (orderIndex !== -1) {
        const page = 1 // Убрали пагинацию, всегда показываем первую страницу
        return { tab: category.name, page: 1 }
      }
    }

    return null
  }, [orders, currentCourierId])

  // Функция для проверки счетчика и получения новых заказов
  const checkForNewOrders = useCallback(async () => {
    try {
      // Добавляем обработку ошибок расширений браузера
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          if (event.message.includes('message channel closed')) {
            console.log('🔧 Игнорируем ошибку расширения браузера')
            event.preventDefault()
            return false
          }
        })
      }
      
      // Получаем ВСЕ текущие доступные заказы
      const ordersResponse = await fetch('/api/courier/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      })
      
      if (!ordersResponse.ok) {
        console.error('Ошибка получения заказов:', ordersResponse.status, ordersResponse.statusText)
        return
      }
      
      const ordersData = await ordersResponse.json()
      if (!ordersData.success) {
        console.error('Ошибка API заказов:', ordersData.error)
        return
      }
      
      const allOrders = ordersData.data || []
      
      // Фильтруем доступные заказы
      const availableOrders = allOrders.filter((order: OrderWithDetails) => 
        order.status === 'COURIER_WAIT' && !order.courierId
      )
      
      const currentCount = availableOrders.length
      const currentOrderIds = new Set<string>(availableOrders.map((order: OrderWithDetails) => order.id))
      
      // Находим заказы, которых не было в предыдущем списке (реально новые)
      const newOrderIds = Array.from(currentOrderIds).filter((id) => !previousOrderIds.has(id as string))
      
      if (newOrderIds.length > 0) {
        console.log(`🎯 Обнаружено ${newOrderIds.length} новых заказов:`, newOrderIds.map((id) => (id as string).slice(-8)))
        console.log(`📊 Статистика: previousOrderIds=${previousOrderIds.size}, currentOrderIds=${currentOrderIds.size}, notifiedOrderIds=${notifiedOrderIds.size}`)
        
        // Получаем объекты заказов для новых ID
        const newOrders = availableOrders.filter((order: OrderWithDetails) => newOrderIds.includes(order.id as string))
        
        // Фильтруем заказы, для которых еще не отправлены уведомления
        const ordersToNotify = newOrders.filter((order: OrderWithDetails) => !notifiedOrderIds.has(order.id as string))
        
        if (ordersToNotify.length > 0) {
          console.log(`📤 Отправляем уведомления для ${ordersToNotify.length} заказов:`, ordersToNotify.map((o: OrderWithDetails) => (o.id as string).slice(-8)))
          
          // Отправляем браузерные уведомления для каждого нового заказа
          ordersToNotify.forEach((order: OrderWithDetails) => {
            const orderNumber = order.id.slice(-8)
            const totalAmount = order.orderItems.reduce((sum, item) => 
              sum + Number(item.price) * item.amount, 0
            )
            
            sendBrowserNotification(
              '📦 Новый заказ!',
              `Заказ #${orderNumber}\nАдрес: ${order.deliveryAddress}\nСумма: ${totalAmount} сом`,
              '/favicon.ico'
            )
          })
          
          // Отправляем уведомления параллельно с использованием Promise.all
          const notificationPromises = ordersToNotify.map(async (order: OrderWithDetails) => {
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 секунд таймаут
              
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
                console.log('✅ Уведомление отправлено для заказа:', (order.id as string).slice(-8))
                // Добавляем ID заказа в Set отправленных уведомлений
                setNotifiedOrderIds(prev => new Set(prev).add(order.id as string))
                return { success: true, orderId: order.id }
              } else {
                console.error('❌ Ошибка отправки уведомления для заказа:', (order.id as string).slice(-8), response.status)
                return { success: false, orderId: order.id }
              }
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                console.log('⏰ Таймаут отправки уведомления для заказа:', (order.id as string).slice(-8))
              } else {
                console.error('❌ Ошибка отправки уведомления:', error)
              }
              return { success: false, orderId: order.id }
            }
          })
          
          // Ждем завершения всех уведомлений
          await Promise.allSettled(notificationPromises)
        } else {
          console.log('ℹ️ Все новые заказы уже имеют отправленные уведомления')
        }
      }
      
      // Обновляем сохраненный список ID заказов и счетчик
      setPreviousOrderIds(new Set(Array.from(currentOrderIds)))
      setPreviousAvailableCount(currentCount)
      
    } catch (error) {
      // Не логируем таймауты как ошибки, это нормальное поведение
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏰ Таймаут при проверке новых заказов - это нормально')
        return
      }
      
      console.error('Ошибка проверки новых заказов:', error)
      
      // Более детальная обработка ошибок
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          console.log('🌐 Проблема с подключением к серверу')
        } else {
          console.log('❌ Неизвестная ошибка:', error.message)
        }
      }
    }
  }, [previousOrderIds, notifiedOrderIds])

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    
    try {
      const response = await fetch('/api/courier/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Добавляем таймаут для запроса
        signal: AbortSignal.timeout(20000) // 20 секунд таймаут
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
        setError('')
        
        // Инициализируем счетчик доступных заказов при первой загрузке
        if (showLoading) {
          const availableOrders = newOrders.filter((order: OrderWithDetails) => 
            order.status === 'COURIER_WAIT' && !order.courierId
          )
          const availableOrderIds = new Set<string>(availableOrders.map((order: OrderWithDetails) => order.id))
          
          setPreviousOrderIds(new Set(Array.from(availableOrderIds)))
          setPreviousAvailableCount(availableOrders.length)
          
          // ВАЖНО: Добавляем все существующие заказы в notifiedOrderIds при инициализации
          // чтобы не отправлять для них повторные уведомления
          setNotifiedOrderIds(new Set(Array.from(availableOrderIds)))
          
          setIsInitialized(true)
          
          console.log(`🔄 Инициализация: найдено ${availableOrders.length} доступных заказов, добавлены в notifiedOrderIds`)
        }
      } else {
        setError(data.error || t('error'))
        console.error('Ошибка API:', data.error)
      }
    } catch (error) {
      // Не логируем таймауты как ошибки, это нормальное поведение
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏰ Запрос был прерван (таймаут) - это нормально')
        return
      }
      
      console.error('Ошибка загрузки заказов:', error)
      
      // Обрабатываем разные типы ошибок
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          console.log('🌐 Сервер недоступен - проверьте, что сервер запущен')
        } else {
          console.log('❌ Неизвестная ошибка:', error.message)
        }
      }
      
      
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
        
        // Принудительно переключаемся на нужную вкладку
        console.log(`🔄 Переключаемся на вкладку "${targetTab}" для заказа ${orderId.slice(-8)} со статусом ${status}`)
        setActiveTab(targetTab)
        
        // Устанавливаем флаг недавнего изменения статуса
        setRecentStatusChange(true)
        
        // Сбрасываем флаг через 3 секунды
        setTimeout(() => {
          setRecentStatusChange(false)
        }, 3000)
        
        // Отправляем браузерное уведомление об изменении статуса
        const orderNumber = orderId.slice(-8)
        const statusLabels: Record<OrderStatus, string> = {
          'CREATED': 'Создан',
          'COURIER_WAIT': 'Ожидает курьера',
          'COURIER_PICKED': 'Принят',
          'ENROUTE': 'В пути',
          'DELIVERED': 'Доставлен',
          'CANCELED': 'Отменен'
        }
        
        sendBrowserNotification(
          '📋 Статус заказа обновлен',
          `Заказ #${orderNumber}\nСтатус: ${statusLabels[status]}`,
          '/favicon.ico'
        )
        
        // Добавляем эффект свечения к обновленному заказу
        addGlowEffect(orderId)
        
        // Обновляем данные заказов для корректного отображения
        await fetchOrders(false)
        
        // После обновления данных находим местоположение заказа
        setTimeout(() => {
          const location = findOrderLocation(orderId)
          if (location) {
            // Убираем дополнительное переключение - оставляем пользователя на targetTab
            console.log(`✅ Заказ ${orderId.slice(-8)} найден на вкладке "${location.tab}", остаемся на "${targetTab}"`)
          }
        }, 200) // Увеличиваем задержку для более надежного обновления
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
        // Не переключаем вкладку, если недавно было изменение статуса
        if (!recentStatusChange) {
          console.log(`🔄 Переключение на вкладку "${tab}" из URL параметра`)
          setActiveTab(tab as TabType)
        } else {
          console.log(`⏸️ Пропускаем переключение на "${tab}" из-за недавнего изменения статуса`)
        }
      }
    }
  }, [orders, searchParams, recentStatusChange])


  // Автоматическое обновление каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInitialized) {
        // Сначала проверяем новые заказы
        checkForNewOrders()
        // Затем обновляем общий список заказов
        fetchOrders(false) // Обновляем без показа loading
      }
    }, 5000) // 5 секунд

    return () => clearInterval(interval)
  }, [fetchOrders, checkForNewOrders, isInitialized])

  // Очистка notifiedOrderIds для заказов, которые больше не в статусе COURIER_WAIT
  useEffect(() => {
    if (orders.length > 0 && notifiedOrderIds.size > 0) {
      const currentAvailableOrderIds = new Set(
        orders
          .filter(order => order.status === 'COURIER_WAIT' && !order.courierId)
          .map(order => order.id)
      )
      
      // Удаляем ID заказов, которые больше не в статусе COURIER_WAIT
      const updatedNotifiedIds = new Set(
        Array.from(notifiedOrderIds).filter(id => currentAvailableOrderIds.has(id))
      )
      
      // Обновляем Set только если что-то изменилось
      if (updatedNotifiedIds.size !== notifiedOrderIds.size) {
        console.log(`🧹 Очищено ${notifiedOrderIds.size - updatedNotifiedIds.size} старых ID из списка отправленных уведомлений`)
        setNotifiedOrderIds(updatedNotifiedIds)
      }
    }
  }, [orders, notifiedOrderIds])

  // Функция поиска и фильтрации заказов
  const filterAndSortOrders = useCallback((ordersList: OrderWithDetails[]) => {
    let filtered = [...ordersList]
    
    // Применяем поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      
      filtered = filtered.filter(order => {
        // Поиск по ID заказа
        if (order.id.toLowerCase().includes(query)) return true
        
        // Поиск по адресу доставки
        if (order.deliveryAddress?.toLowerCase().includes(query)) return true
        
        // Поиск по комментарию клиента
        if (order.customerComment?.toLowerCase().includes(query)) return true
        
        // Поиск по имени клиента
        if (order.customerName?.toLowerCase().includes(query)) return true
        
        // Поиск по телефону клиента
        if (order.customerPhone?.toLowerCase().includes(query)) return true
        
        // Поиск по товарам в заказе
        if (order.orderItems && order.orderItems.length > 0) {
          const hasMatchingItem = order.orderItems.some((item) => 
            item.product?.name?.toLowerCase().includes(query)
          )
          if (hasMatchingItem) return true
        }
        
        return false
      })
    }
    
    // Применяем фильтр по дате
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return orderDate >= today
          case 'yesterday':
            return orderDate >= yesterday && orderDate < today
          case 'week':
            return orderDate >= weekAgo
          case 'month':
            return orderDate >= monthAgo
          default:
            return true
        }
      })
    }
    
    // Применяем фильтр по цене
    if (priceMin || priceMax) {
      filtered = filtered.filter(order => {
        const total = order.orderItems.reduce((sum, item) => 
          sum + Number(item.price) * item.amount, 0
        )
        
        const min = priceMin ? Number(priceMin) : 0
        const max = priceMax ? Number(priceMax) : Infinity
        
        return total >= min && total <= max
      })
    }
    
    // Применяем фильтр по количеству товаров
    if (itemsMin || itemsMax) {
      filtered = filtered.filter(order => {
        const totalItems = order.orderItems.reduce((sum, item) => sum + item.amount, 0)
        
        const min = itemsMin ? Number(itemsMin) : 0
        const max = itemsMax ? Number(itemsMax) : Infinity
        
        return totalItems >= min && totalItems <= max
      })
    }
    
    // Применяем сортировку
    filtered.sort((a, b) => {
      const totalA = a.orderItems.reduce((sum, item) => sum + Number(item.price) * item.amount, 0)
      const totalB = b.orderItems.reduce((sum, item) => sum + Number(item.price) * item.amount, 0)
      const itemsA = a.orderItems.reduce((sum, item) => sum + item.amount, 0)
      const itemsB = b.orderItems.reduce((sum, item) => sum + item.amount, 0)
      
      switch (sortBy) {
        case 'date-new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-old':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'price-high':
          return totalB - totalA
        case 'price-low':
          return totalA - totalB
        case 'items-high':
          return itemsB - itemsA
        case 'items-low':
          return itemsA - itemsB
        default:
          return 0
      }
    })
    
    return filtered
  }, [searchQuery, priceMin, priceMax, itemsMin, itemsMax, dateFilter, sortBy])

  // Группируем заказы по статусам
  // Доступные заказы - только те, что админ подтвердил (COURIER_WAIT) и еще не назначены
  const availableOrders = filterAndSortOrders(
    orders.filter(order => 
      order.status === 'COURIER_WAIT' && !order.courierId
    )
  )
  
  // Мои заказы - те, что я принял в работу (только мои заказы)
  const myOrders = filterAndSortOrders(
    orders.filter(order => 
      order.courierId === currentCourierId && ['COURIER_PICKED', 'ENROUTE'].includes(order.status)
    )
  )
  
  // Завершенные заказы - те, что я доставил (только мои заказы)
  const completedOrders = filterAndSortOrders(
    orders.filter(order => 
      order.status === 'DELIVERED' && order.courierId === currentCourierId
    )
  )
  
  // Отмененные заказы - те, что были отменены (только мои заказы)
  const canceledOrders = filterAndSortOrders(
    orders.filter(order => 
      order.status === 'CANCELED' && order.courierId === currentCourierId
    )
  )



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
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      
      {/* Левый Sidebar для десктопа */}
      <div className="hidden lg:flex lg:w-80 p-4 flex-shrink-0 h-full">
        <aside className="flex flex-col w-full h-full rounded-2xl px-5 py-4 shadow-2xl overflow-hidden" style={{ backgroundColor: '#242b3d' }}>
          {/* Заголовок */}
        <div className="mb-3 flex-shrink-0">
          <h1 className="text-xl mb-2 tracking-tight text-white">
            {t('courierPanel')}
          </h1>
          <p className="text-sm mb-3 text-gray-400">
            {t('manageOrders')}
          </p>
        </div>

          {/* Вкладки навигации - скроллящиеся при необходимости */}
          <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('available')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                activeTab === 'available'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ClockIcon className={`w-5 h-5 ${activeTab === 'available' ? 'text-white' : 'text-yellow-400'}`} />
                <span>{t('available')}</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                activeTab === 'available' ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {availableOrders.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('my')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                activeTab === 'my'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BoltIcon className={`w-5 h-5 ${activeTab === 'my' ? 'text-white' : 'text-blue-400'}`} />
                <span>{t('inWork')}</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                activeTab === 'my' ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {myOrders.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('completed')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className={`w-5 h-5 ${activeTab === 'completed' ? 'text-white' : 'text-green-400'}`} />
                <span>{t('delivered')}</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {completedOrders.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('canceled')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                activeTab === 'canceled'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <XCircleIcon className={`w-5 h-5 ${activeTab === 'canceled' ? 'text-white' : 'text-red-400'}`} />
                <span>{t('canceled')}</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                activeTab === 'canceled' ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {canceledOrders.length}
              </span>
            </button>
          </nav>
        </aside>
      </div>

      {/* Основной контент - занимает оставшуюся высоту */}
      <div className="flex-1 flex flex-col overflow-hidden h-full pb-16 lg:pb-0">
        {/* Фиксированный хедер */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          {/* Уведомление о настройке Telegram */}
          {showTelegramNotification && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Настройте Telegram для уведомлений о заказах
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Для получения мгновенных уведомлений о новых заказах необходимо подключить ваш аккаунт к Telegram боту.
                    </p>
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <button
                    onClick={() => setShowTelegramNotification(false)}
                    className="inline-flex text-yellow-400 hover:text-yellow-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Мобильная версия - заголовок, поиск и статистика */}
          <div className="lg:hidden space-y-4">
            <div>
              <h1 className="text-xl mb-1 tracking-tight text-white">
                {t('courierPanel')}
              </h1>
              <p className="text-xs mb-2 text-gray-400">
                {t('manageOrders')}
              </p>
            </div>

            {/* Поиск для мобильной версии */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('searchOrders') || 'Поиск...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

        </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
              {error}
              <button 
                onClick={() => setError('')}
                className="ml-2 text-red-800 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Скроллящийся контент с заказами */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pt-4 pb-0">
          {/* Панель фильтров и сортировки */}
          <div className="max-w-[1600px] mx-auto mb-4">
            <div className="flex items-center justify-between gap-3">
              {/* Кнопка фильтров */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <FunnelIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Фильтры</span>
              </button>
              
              {/* Сортировка */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ArrowsUpDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                <CustomDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortType)}
                  icon={ArrowsUpDownIcon}
                  className="min-w-[140px] sm:min-w-[160px]"
                />
              </div>
            </div>
            
            {/* Панель фильтров */}
            {showFilters && (
              <div className="mt-3 p-4 rounded-lg border animate-in slide-in-from-top-2" style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)'
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Фильтр по дате */}
                  <div>
                    <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                      <CalendarIcon className="w-4 h-4" />
                      Период
                    </label>
                    <CustomDropdown
                      options={dateFilterOptions}
                      value={dateFilter}
                      onChange={(value) => setDateFilter(value as DateFilterType)}
                      icon={CalendarIcon}
                    />
                  </div>
                  
                  {/* Фильтр по цене */}
                  <div>
                    <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                      <CurrencyDollarIcon className="w-4 h-4" />
                      Цена заказа (₽)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="От"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--background)',
                          color: 'var(--foreground)',
                          borderColor: 'var(--border)'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="До"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--background)',
                          color: 'var(--foreground)',
                          borderColor: 'var(--border)'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Фильтр по количеству товаров */}
                  <div>
                    <label className="flex items-center gap-2 text-sm mb-2 text-gray-400">
                      <ShoppingBagIcon className="w-4 h-4" />
                      Кол-во товаров (шт.)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="От"
                        value={itemsMin}
                        onChange={(e) => setItemsMin(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--background)',
                          color: 'var(--foreground)',
                          borderColor: 'var(--border)'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="До"
                        value={itemsMax}
                        onChange={(e) => setItemsMax(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--background)',
                          color: 'var(--foreground)',
                          borderColor: 'var(--border)'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Кнопка сброса фильтров */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFilter('all')
                        setPriceMin('')
                        setPriceMax('')
                        setItemsMin('')
                        setItemsMax('')
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <ArrowsUpDownIcon className="w-4 h-4" />
                      Сбросить все
                    </button>
                  </div>
                </div>
                
                {/* Активные фильтры - показываем бейджи */}
                {(dateFilter !== 'all' || priceMin || priceMax || itemsMin || itemsMax) && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs text-gray-400">Активные фильтры:</span>
                    
                    {dateFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        {dateFilter === 'today' ? 'Сегодня' : dateFilter === 'yesterday' ? 'Вчера' : dateFilter === 'week' ? 'За неделю' : 'За месяц'}
                      </span>
                    )}
                    
                    {(priceMin || priceMax) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
                        <CurrencyDollarIcon className="w-3 h-3" />
                        {priceMin || '0'} - {priceMax || '∞'} ₽
                      </span>
                    )}
                    
                    {(itemsMin || itemsMax) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs">
                        <ShoppingBagIcon className="w-3 h-3" />
                        {itemsMin || '0'} - {itemsMax || '∞'} шт.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Содержимое вкладок */}
          <div className="max-w-[1600px] mx-auto">
            {/* Доступные заказы */}
            {activeTab === 'available' && (
            <div>
              {availableOrders.length > 0 ? (
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {availableOrders.map(renderOrderCard)}
                </div>
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
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {myOrders.map(renderOrderCard)}
                </div>
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
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {completedOrders.map(renderOrderCard)}
                </div>
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
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {canceledOrders.map(renderOrderCard)}
                </div>
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
        </div>
      </div>

      {/* Модальное окно с деталями заказа */}
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />

      {/* Мобильное меню внизу */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--navbar-bg)' }}>
        <div className="flex items-center justify-around py-2">
          {[
            { key: 'available', label: t('available'), icon: ClockIcon, count: availableOrders.length },
            { key: 'my', label: t('inWork'), icon: BoltIcon, count: myOrders.length },
            { key: 'completed', label: t('delivered'), icon: CheckCircleIcon, count: completedOrders.length },
            { key: 'canceled', label: t('canceled'), icon: XCircleIcon, count: canceledOrders.length }
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                activeTab === key
                  ? 'text-white'
                  : 'text-gray-400'
              }`}
              style={{
                backgroundColor: activeTab === key ? 'var(--background-subtle)' : 'transparent'
              }}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${
                  activeTab === key
                    ? 'text-white'
                    : key === 'available' ? 'text-yellow-400' :
                      key === 'my' ? 'text-blue-400' :
                      key === 'completed' ? 'text-green-400' :
                      'text-red-400'
                }`} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 truncate max-w-16">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
