'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseClasses = 'glass-button font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent'
  
  const variantClasses = {
    primary: 'button-primary text-white',
    secondary: 'bg-glass-white-light border-glass-white-border text-glass-heading hover:bg-glass-white-border',
    ghost: 'bg-transparent border-transparent text-glass-heading hover:bg-glass-white-light',
    danger: 'bg-error/20 border-error/30 text-error hover:bg-error/30'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>
    </button>
  )
}