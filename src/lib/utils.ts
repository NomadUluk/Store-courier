import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(numPrice)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function formatPhoneNumber(phone: string): string {
  // Простое форматирование номера телефона
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`
  }
  return phone
}

export function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    CREATED: 'Создан',
    COURIER_WAIT: 'Ожидает курьера',
    COURIER_PICKED: 'Курьер назначен',
    ENROUTE: 'В пути',
    DELIVERED: 'Доставлен',
    CANCELED: 'Отменен',
  }
  return statusMap[status] || status
}

export function getUserRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    ADMIN: 'Администратор',
    COURIER: 'Курьер',
    SELLER: 'Продавец',
  }
  return roleMap[role] || role
}
