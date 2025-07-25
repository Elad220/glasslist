'use client'

import { useEffect } from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { useUndoRedoWithExecution } from '@/lib/undo-redo/hooks'

interface UndoRedoButtonsProps {
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function UndoRedoButtons({ 
  className = '', 
  showLabels = false,
  size = 'md'
}: UndoRedoButtonsProps) {
  const { executeUndo, executeRedo, canUndo, canRedo } = useUndoRedoWithExecution()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      // Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault()
          if (canUndo) {
            executeUndo()
          }
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault()
          if (canRedo) {
            executeRedo()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [executeUndo, executeRedo, canUndo, canRedo])

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={executeUndo}
        disabled={!canUndo}
        className={`
          glass-button flex items-center gap-2 transition-all duration-200
          ${sizeClasses[size]}
          ${canUndo 
            ? 'hover:bg-primary/20 hover:scale-105' 
            : 'opacity-50 cursor-not-allowed'
          }
        `}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className={iconSizes[size]} />
        {showLabels && <span>Undo</span>}
      </button>

      <button
        onClick={executeRedo}
        disabled={!canRedo}
        className={`
          glass-button flex items-center gap-2 transition-all duration-200
          ${sizeClasses[size]}
          ${canRedo 
            ? 'hover:bg-secondary/20 hover:scale-105' 
            : 'opacity-50 cursor-not-allowed'
          }
        `}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className={iconSizes[size]} />
        {showLabels && <span>Redo</span>}
      </button>
    </div>
  )
}