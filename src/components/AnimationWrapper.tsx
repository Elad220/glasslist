'use client'

import { ReactNode, useEffect, useState } from 'react'

interface AnimationWrapperProps {
  children: ReactNode
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in' | 'slide-in-left' | 'slide-in-right'
  delay?: number
  duration?: number
  className?: string
  threshold?: number
  trigger?: 'onMount' | 'onScroll' | 'onHover'
  stagger?: boolean
  staggerIndex?: number
}

export default function AnimationWrapper({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 600,
  className = '',
  threshold = 0.1,
  trigger = 'onMount',
  stagger = false,
  staggerIndex = 0
}: AnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (trigger === 'onMount') {
      const timer = setTimeout(() => {
        setIsVisible(true)
        setHasTriggered(true)
      }, delay + (stagger ? staggerIndex * 100 : 0))
      
      return () => clearTimeout(timer)
    }
  }, [trigger, delay, stagger, staggerIndex])

  useEffect(() => {
    if (trigger === 'onScroll') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasTriggered) {
            setIsVisible(true)
            setHasTriggered(true)
          }
        },
        { threshold }
      )

      const element = document.getElementById(`animation-${staggerIndex}`)
      if (element) {
        observer.observe(element)
      }

      return () => observer.disconnect()
    }
  }, [trigger, threshold, hasTriggered, staggerIndex])

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300'
    
    switch (animation) {
      case 'fade-in':
        return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`
      case 'slide-up':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
      case 'slide-down':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`
      case 'scale-in':
        return `${baseClasses} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`
      case 'slide-in-left':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`
      case 'slide-in-right':
        return `${baseClasses} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`
      default:
        return baseClasses
    }
  }

  const handleMouseEnter = () => {
    if (trigger === 'onHover' && !hasTriggered) {
      setIsVisible(true)
      setHasTriggered(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'onHover') {
      setIsVisible(false)
      setHasTriggered(false)
    }
  }

  return (
    <div
      id={trigger === 'onScroll' ? `animation-${staggerIndex}` : undefined}
      className={`${getAnimationClasses()} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

// Staggered animation wrapper for lists
export function StaggeredAnimationWrapper({
  children,
  items,
  animation = 'slide-up',
  className = '',
  delay = 100
}: {
  children: (item: any, index: number) => ReactNode
  items: any[]
  animation?: AnimationWrapperProps['animation']
  className?: string
  delay?: number
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <AnimationWrapper
          key={index}
          animation={animation}
          delay={delay * index}
          stagger={true}
          staggerIndex={index}
        >
          {children(item, index)}
        </AnimationWrapper>
      ))}
    </div>
  )
}

// Page transition wrapper
export function PageTransitionWrapper({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`animate-page-load ${className}`}>
      {children}
    </div>
  )
}

// Hover animation wrapper
export function HoverAnimationWrapper({
  children,
  scale = 1.05,
  className = ''
}: {
  children: ReactNode
  scale?: number
  className?: string
}) {
  return (
    <div 
      className={`transition-transform duration-300 hover:scale-${scale} ${className}`}
    >
      {children}
    </div>
  )
}