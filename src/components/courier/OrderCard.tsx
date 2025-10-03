'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { OrderWithDetails, OrderStatus } from '@/types'

interface OrderCardProps {
  order: OrderWithDetails
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>
  isUpdating?: boolean
}

export function OrderCard({ order, onStatusUpdate, isUpdating = false }: OrderCardProps) {
  const { t } = useLanguage()
  
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
        variant: 'default' as const
      })
    } else if (status === 'COURIER_PICKED') {
      actions.push({
        label: t('startDelivery'),
        status: 'ENROUTE' as OrderStatus,
        variant: 'default' as const
      })
    } else if (status === 'ENROUTE') {
      actions.push({
        label: t('markDelivered'),
        status: 'DELIVERED' as OrderStatus,
        variant: 'default' as const
      })
    }
    
    return actions
  }

  const totalAmount = order.orderItems.reduce((sum, item) => 
    sum + Number(item.price) * item.amount, 0
  )

  const actions = getNextActions(order.status, order.courierId)

  return (
    <div className="card p-6 space-y-6 border-2">
      {/* Заголовок заказа */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t('orderNumber')}{order.id.slice(-8)}</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {new Date(order.createdAt).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {/* Информация о клиенте */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--secondary)' }}>
        <div className="flex items-center space-x-2 mb-3">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('customerInfo')}</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium w-20" style={{ color: 'var(--muted)' }}>{t('name')}:</span>
            <span style={{ color: 'var(--foreground)' }}>{order.customerName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium w-20" style={{ color: 'var(--muted)' }}>{t('phone')}:</span>
            <a href={`tel:${order.customerPhone}`} className="text-primary hover:text-primary-hover transition-colors">
              {order.customerPhone}
            </a>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium w-20" style={{ color: 'var(--muted)' }}>{t('address')}:</span>
            <span className="flex-1" style={{ color: 'var(--foreground)' }}>{order.deliveryAddress}</span>
          </div>
          {/* Комментарии */}
          <div className="space-y-2">
            {order.customerComment && (
              <div className="bg-green-50 p-2 rounded-md border border-green-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-900">{t('customerComment')}:</p>
                    <p className="text-xs text-green-700 italic mt-0.5">"{order.customerComment}"</p>
                  </div>
                </div>
              </div>
            )}
            {order.status === 'CANCELED' && order.cancelComment && (
              <div className="bg-red-50 p-2 rounded-md border border-red-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-900">{t('cancelComment')}:</p>
                    <p className="text-xs text-red-700 italic mt-0.5">"{order.cancelComment}"</p>
                  </div>
                </div>
              </div>
            )}
            {order.adminComment && (
              <div className="bg-blue-50 p-2 rounded-md border border-blue-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900">{t('adminComment')}:</p>
                    <p className="text-xs text-blue-700 italic mt-0.5">"{order.adminComment}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Товары в заказе */}
      <div className="border-2 rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('orderItems')}</h4>
        </div>
        <div className="space-y-3">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b-2 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{item.product.name}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('quantity')}: {item.amount}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {(Number(item.price) * item.amount).toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {Number(item.price).toLocaleString('ru-RU')} ₽ × {item.amount}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-3 mt-4" style={{ backgroundColor: 'var(--secondary)' }}>
          <div className="flex justify-between items-center">
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('totalAmount')}:</span>
            <span className="text-xl font-bold text-primary">
              {totalAmount.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Информация о курьере */}
      {order.courier && (
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-4-5v9M3 9l4-4 4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
            </svg>
            <h4 className="font-semibold text-blue-900">{t('courier')}</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-700 w-20">{t('name')}:</span>
              <span className="text-blue-900">{order.courier.fullname}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-700 w-20">{t('phone')}:</span>
              <a href={`tel:${order.courier.phoneNumber}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                {order.courier.phoneNumber}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Действия */}
      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => onStatusUpdate(order.id, action.status)}
              disabled={isUpdating}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('updating')}
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  {action.status === 'COURIER_PICKED' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {action.status === 'ENROUTE' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {action.status === 'DELIVERED' && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{action.label}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
