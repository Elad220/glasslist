'use client'

import { ReactNode } from 'react'

interface LoadingSkeletonProps {
  type?: 'text' | 'card' | 'button' | 'avatar' | 'list-item'
  lines?: number
  className?: string
  children?: ReactNode
}

export default function LoadingSkeleton({ 
  type = 'text', 
  lines = 1, 
  className = '',
  children 
}: LoadingSkeletonProps) {
  const baseClasses = 'skeleton-loader rounded-lg'
  
  const typeClasses = {
    text: 'h-4',
    card: 'h-32',
    button: 'h-10 w-24',
    avatar: 'w-12 h-12 rounded-full',
    'list-item': 'h-16'
  }
  
  if (children) {
    return (
      <div className={`${baseClasses} ${className}`}>
        {children}
      </div>
    )
  }
  
  if (type === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index} 
            className={`${baseClasses} ${typeClasses.text} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="space-y-4">
        <LoadingSkeleton type="text" className="w-1/2" />
        <LoadingSkeleton type="text" lines={3} />
        <div className="flex gap-2">
          <LoadingSkeleton type="button" />
          <LoadingSkeleton type="button" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="flex items-center gap-3">
            <LoadingSkeleton type="avatar" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton type="text" className="w-3/4" />
              <LoadingSkeleton type="text" className="w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-page-load">
      {/* Header */}
      <div className="glass-card p-6">
        <LoadingSkeleton type="text" className="w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-card p-4">
              <LoadingSkeleton type="text" className="w-1/2 mb-2" />
              <LoadingSkeleton type="text" className="w-3/4" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      {/* List */}
      <ListSkeleton count={5} />
    </div>
  )
}