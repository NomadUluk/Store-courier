'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { OrderWithDetails, OrderStatus } from '@/types'

interface CompactOrderCardProps {
  order: OrderWithDetails
  onClick: () => void
}

export function CompactOrderCard({ order, onClick }: CompactOrderCardProps) {
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'COURIER_WAIT':
        return (
          <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center border border-yellow-200">
            <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'COURIER_PICKED':
        return (
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'ENROUTE':
        return (
          <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center border border-orange-200">
            <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'DELIVERED':
        return (
          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )
    }
  }

  const totalAmount = order.orderItems.reduce((sum, item) => 
    sum + Number(item.price) * item.amount, 0
  )

  const totalItems = order.orderItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div 
      onClick={onClick}
      className="card p-2.5 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2"
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-1.5">
        {getStatusIcon(order.status)}
        {getStatusBadge(order.status)}
      </div>

      {/* Номер заказа */}
      <div className="mb-1.5">
        <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
          #{order.id.slice(-8)}
        </h3>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {new Date(order.createdAt).toLocaleDateString('ru-RU')} в{' '}
          {new Date(order.createdAt).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {/* Информация о клиенте - показываем только для принятых заказов */}
      {order.status !== 'COURIER_WAIT' && (
        <div className="mb-1.5">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
            {order.customerName}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
            {order.customerPhone}
          </p>
        </div>
      )}

      {/* Адрес доставки */}
      <div className="mb-2">
        <div className="flex items-start space-x-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
            {order.deliveryAddress}
          </p>
        </div>
      </div>

      {/* Информация о товарах и сумме */}
      <div className="border-t-2 pt-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            {totalItems} {totalItems === 1 ? t('item') : totalItems < 5 ? t('items2') : t('items')}
          </div>
          <div className="font-bold text-sm text-primary">
            {totalAmount.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      {/* Индикатор комментария */}
      {order.customerComment && (
        <div className="mt-1.5 flex items-center space-x-1">
          <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
          </svg>
          <span className="text-xs text-blue-600">{t('hasComment')}</span>
        </div>
      )}

    </div>
  )
}

