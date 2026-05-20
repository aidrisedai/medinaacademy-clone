import React from 'react'
import type { UserStatus } from '@/types'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: UserStatus
  className?: string
}

const sizes = {
  xs: { container: 'w-5 h-5 text-xs', status: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8 text-sm', status: 'w-2.5 h-2.5 border' },
  md: { container: 'w-9 h-9 text-sm', status: 'w-3 h-3 border-2' },
  lg: { container: 'w-12 h-12 text-base', status: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-16 h-16 text-xl', status: 'w-4 h-4 border-2' },
}

const statusColors: Record<UserStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  dnd: 'bg-red-500',
  offline: 'bg-gray-400',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-purple-600',
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-red-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, name, size = 'md', status, className = '' }: AvatarProps) {
  const { container, status: statusSize } = sizes[size]
  const colorClass = getAvatarColor(name)

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`${container} rounded-md overflow-hidden flex items-center justify-center font-bold text-white ${src ? '' : colorClass}`}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && status !== 'offline' && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${statusSize} rounded-full ${statusColors[status]} border-white ring-0`}
        />
      )}
    </div>
  )
}
