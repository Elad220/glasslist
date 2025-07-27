'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface AnimationWrapperProps {
  children: ReactNode
  animation?: 'slide-up' | 'slide-down' | 'scale-in' | 'rotate-in' | 'bounce-in' | 'fade-in'
  delay?: string
  className?: string
  onHover?: 'lift' | 'glow' | 'scale'
  onClick?: 'scale' | 'ripple'
}

export default function AnimationWrapper({
  children,
  animation = 'slide-up',
  delay,
  className = '',
  onHover,
  onClick
}: AnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const animationClass = isVisible ? `animate-${animation}` : 'opacity-0'
  const hoverClass = onHover ? `hover-${onHover}` : ''
  const clickClass = onClick ? `micro-interaction` : ''

  return (
    <div
      ref={ref}
      className={`${animationClass} ${delay || ''} ${hoverClass} ${clickClass} ${className}`}
    >
      {children}
    </div>
  )
}