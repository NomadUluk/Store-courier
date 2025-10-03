'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { OrderWithDetails, OrderStatus } from '@/types'

interface CompactOrderCardProps {
  order: OrderWithDetails
  onClick: () => void
  isGlowing?: boolean
}

export function CompactOrderCard({ order, onClick, isGlowing = false }: CompactOrderCardProps) {
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
          <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center border border-yellow-200">
            <svg className="w-3 h-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'COURIER_PICKED':
        return (
          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
            <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'ENROUTE':
        return (
          <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center border border-orange-200">
            <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'DELIVERED':
        return (
          <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      className={`card p-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 ${
        isGlowing 
          ? 'animate-pulse shadow-lg shadow-blue-500/50 border-blue-400 bg-blue-50' 
          : ''
      }`}
    >
      {/* Заголовок с статусом */}
      <div className="flex items-center justify-between mb-2">
        {getStatusIcon(order.status)}
        {getStatusBadge(order.status)}
      </div>

      {/* Табличная компоновка */}
      <div className="space-y-1">
        {/* Строка 1: Номер заказа / Дата и время */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
              #{order.id.slice(-8)}
            </span>
          </div>
          <div className="text-right font-medium" style={{ color: 'var(--foreground)' }}>
            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} {' '}
            {new Date(order.createdAt).toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Строка 2: ФИО клиента / Номер клиента (только для принятых заказов) */}
        {order.status !== 'COURIER_WAIT' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
              {order.customerName}
            </div>
            <div className="text-right flex items-center justify-end space-x-1" style={{ color: 'var(--muted)' }}>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="truncate">{order.customerPhone}</span>
            </div>
          </div>
        )}

        {/* Строка 3: Адрес */}
        <div className="flex items-start space-x-1">
          <svg className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs font-semibold line-clamp-1" style={{ color: 'var(--foreground)' }}>
            {order.deliveryAddress}
          </p>
        </div>
      </div>

      {/* Нижняя строка: Товары и сумма */}
      <div className="border-t pt-1.5 mt-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {totalItems} {totalItems === 1 ? t('item') : totalItems < 5 ? t('items2') : t('items')}
            </span>
            {/* Индикатор комментария */}
            {(order.customerComment || order.cancelComment || order.adminComment) && (
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                </svg>
                <span className="text-xs text-blue-600">{t('hasComment')}</span>
              </div>
            )}
          </div>
          <div className="font-bold text-sm text-primary">
            {totalAmount.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

    </div>
  )
}

