'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { OrderWithDetails, OrderStatus } from '@/types'

interface OrderDetailModalProps {
  order: OrderWithDetails | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (orderId: string, status: OrderStatus, cancelComment?: string) => Promise<void>
  isUpdating?: boolean
}

export function OrderDetailModal({ 
  order, 
  isOpen, 
  onClose, 
  onStatusUpdate, 
  isUpdating = false 
}: OrderDetailModalProps) {
  const { t } = useLanguage()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelComment, setCancelComment] = useState('')
  const [cancelError, setCancelError] = useState('')
  
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleActionClick = async (action: any) => {
    if (action.requiresComment) {
      setShowCancelModal(true)
    } else {
      await onStatusUpdate(order!.id, action.status)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelComment.trim()) {
      setCancelError(t('cancelCommentRequired') || 'Комментарий обязателен для отмены заказа')
      return
    }
    
    setCancelError('')
    await onStatusUpdate(order!.id, 'CANCELED', cancelComment)
    setShowCancelModal(false)
    setCancelComment('')
  }

  const handleCancelModalClose = () => {
    setShowCancelModal(false)
    setCancelComment('')
    setCancelError('')
  }

  if (!isOpen || !order) return null

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      CREATED: { label: t('created'), color: 'bg-gray-100 text-gray-800' },
      COURIER_WAIT: { label: t('courierWait'), color: 'bg-yellow-100 text-yellow-800' },
      COURIER_PICKED: { label: t('courierPicked'), color: 'bg-blue-100 text-blue-800' },
      ENROUTE: { label: t('enroute'), color: 'bg-primary text-white' },
      DELIVERED: { label: t('deliveredStatus'), color: 'bg-green-100 text-green-800' },
      CANCELED: { label: t('canceled'), color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status]
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getNextActions = (status: OrderStatus, courierId: string | null) => {
    const actions = []
    
    if (status === 'COURIER_WAIT' && !courierId) {
      actions.push({
        label: t('acceptOrder'),
        status: 'COURIER_PICKED' as OrderStatus,
        type: 'primary',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      })
    } else if (status === 'COURIER_PICKED') {
      actions.push({
        label: t('startDelivery'),
        status: 'ENROUTE' as OrderStatus,
        type: 'primary',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      })
      actions.push({
        label: t('cancelOrder') || 'Отменить заказ',
        status: 'CANCELED' as OrderStatus,
        type: 'danger',
        requiresComment: true,
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      })
    } else if (status === 'ENROUTE') {
      actions.push({
        label: t('markDelivered'),
        status: 'DELIVERED' as OrderStatus,
        type: 'primary',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      })
      actions.push({
        label: t('cancelOrder') || 'Отменить заказ',
        status: 'CANCELED' as OrderStatus,
        type: 'danger',
        requiresComment: true,
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      })
    }
    
    return actions
  }

  const totalAmount = order.orderItems.reduce((sum, item) => 
    sum + Number(item.price) * item.amount, 0
  )

  const actions = getNextActions(order.status, order.courierId)

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative rounded-lg border max-w-md w-full max-h-[85vh] overflow-y-auto" style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--border)', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
        }}>
          
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  #{order.id.slice(-8)}
                </h2>
                {getStatusBadge(order.status)}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            
            {/* Информация о клиенте - показываем только для принятых заказов */}
            {order.status !== 'COURIER_WAIT' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{order.customerName}</span>
                  <a 
                    href={`tel:${order.customerPhone}`} 
                    className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{order.customerPhone}</span>
                  </a>
                </div>
                <a 
                  href={`geo:0,0?q=${encodeURIComponent(order.deliveryAddress)}`}
                  onClick={(e) => {
                    // Проверяем, мобильное ли устройство
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    if (!isMobile) {
                      // На компьютере открываем 2GIS
                      e.preventDefault();
                      window.open(`https://2gis.kg/search/${encodeURIComponent(order.deliveryAddress)}`, '_blank');
                    }
                    // На мобильном устройстве используем geo: протокол для выбора приложений
                  }}
                  className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{order.deliveryAddress}</span>
                </a>
                {order.customerComment && (
                  <p className="text-sm text-gray-500 italic">"{order.customerComment}"</p>
                )}
              </div>
            )}
            
            {/* Адрес доставки для доступных заказов */}
            {order.status === 'COURIER_WAIT' && (
              <div className="space-y-2">
                <a 
                  href={`geo:0,0?q=${encodeURIComponent(order.deliveryAddress)}`}
                  onClick={(e) => {
                    // Проверяем, мобильное ли устройство
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    if (!isMobile) {
                      // На компьютере открываем 2GIS
                      e.preventDefault();
                      window.open(`https://2gis.kg/search/${encodeURIComponent(order.deliveryAddress)}`, '_blank');
                    }
                    // На мобильном устройстве используем geo: протокол для выбора приложений
                  }}
                  className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{order.deliveryAddress}</span>
                </a>
                {order.customerComment && (
                  <p className="text-sm text-gray-500 italic">"{order.customerComment}"</p>
                )}
              </div>
            )}

            {/* Товары в заказе */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-gray-500 text-xs">{item.amount} {t('pcs') || 'шт.'}</p>
                    </div>
                    <p className="font-medium">
                      {(Number(item.price) * item.amount).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t('total')}:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {totalAmount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </div>


            {/* Действия */}
            {actions.length > 0 && (
              <div className="flex gap-2">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleActionClick(action)}
                    disabled={isUpdating}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      action.type === 'danger' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {isUpdating ? t('updating') : action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения отмены */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
          <div 
            className="fixed inset-0 transition-opacity"
            onClick={handleCancelModalClose}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative rounded-xl shadow-xl max-w-md w-full" style={{ backgroundColor: 'var(--card-bg)' }}>
              
              {/* Header */}
              <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                    {t('confirmCancelOrder') || 'Подтверждение отмены заказа'}
                  </h3>
                  <button
                    onClick={handleCancelModalClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {t('confirmCancelText') || 'Вы действительно хотите отменить заказ'} #{order.id.slice(-8)}?
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                    {t('pleaseSpecifyReason') || 'Пожалуйста, укажите причину отмены:'}
                  </p>
                </div>

                <div className="mb-4">
                  <textarea
                    value={cancelComment}
                    onChange={(e) => setCancelComment(e.target.value)}
                    placeholder={t('cancelReasonPlaceholder') || 'Укажите причину отмены заказа...'}
                    className="w-full px-3 py-2 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      borderColor: cancelError ? '#ef4444' : 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  />
                  {cancelError && (
                    <p className="text-red-500 text-sm mt-1">{cancelError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelModalClose}
                    className="flex-1 px-4 py-2 border rounded-lg transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {isUpdating ? (t('cancelling') || 'Отменяем...') : (t('confirmCancel') || 'Подтвердить отмену')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
