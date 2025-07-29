import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  children: ReactNode
}

export default function DndPortal({ children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [el] = useState(() => {
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.top = '0'
    div.style.left = '0'
    div.style.width = '100%'
    div.style.height = '100%'
    div.style.pointerEvents = 'none'
    return div
  })

  useEffect(() => {
    document.body.appendChild(el)
    setMounted(true)
    return () => {
      document.body.removeChild(el)
    }
  }, [el])

  if (!mounted) return null
  return createPortal(children, el)
}