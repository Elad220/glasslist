'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    setTransitionStage('fadeOut')
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setTransitionStage('fadeIn')
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out
        ${transitionStage === 'fadeIn' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {displayChildren}
    </div>
  )
}