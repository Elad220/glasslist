'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'glass' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  pulse?: boolean
  glow?: boolean
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  pulse = false,
  glow = false,
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseClasses = 'glass-premium font-semibold transition-all duration-300 hover-lift micro-interaction focus-ring relative overflow-hidden'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 text-primary',
    secondary: 'bg-glass-white-light hover:bg-glass-white-border text-glass-heading',
    glass: 'bg-glass-white hover:bg-glass-white-light text-glass-heading',
    danger: 'bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-600'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-3'
  }
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${pulse ? 'animate-pulse-glow' : ''}
    ${glow ? 'hover-glow' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim()
  
  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 animate-shimmer"></div>
      </div>
      
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center">
        {loading ? (
          <>
            <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizeClasses[size]}`}></div>
            <span className="ml-2">Loading...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className={`${iconSizeClasses[size]} ${children ? '' : ''}`} />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
              <Icon className={`${iconSizeClasses[size]} ${children ? '' : ''}`} />
            )}
          </>
        )}
      </span>
    </button>
  )
}