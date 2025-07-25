'use client'

import { useState } from 'react'
import { History, ChevronDown } from 'lucide-react'
import { useUndoRedo } from '@/lib/undo-redo/context'

interface UndoRedoHistoryProps {
  className?: string
}

export default function UndoRedoHistory({ className = '' }: UndoRedoHistoryProps) {
  const { state } = useUndoRedo()
  const [isOpen, setIsOpen] = useState(false)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const allActions = [
    ...state.past.map(action => ({ ...action, status: 'past' })),
    ...(state.present ? [{ ...state.present, status: 'present' }] : []),
    ...state.future.map(action => ({ ...action, status: 'future' }))
  ]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button p-2 flex items-center gap-2 text-sm"
        title="View action history"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">History</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-card p-4 z-50">
          <h3 className="font-semibold text-glass-heading mb-3">Action History</h3>
          
          {allActions.length === 0 ? (
            <p className="text-glass-muted text-sm">No actions yet</p>
          ) : (
            <div className="space-y-2">
              {allActions.map((action, index) => (
                <div
                  key={action.id}
                  className={`p-2 rounded text-xs ${
                    action.status === 'present' 
                      ? 'bg-primary/20 border border-primary/30' 
                      : action.status === 'future'
                      ? 'opacity-60'
                      : 'bg-glass-white-light'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{action.description}</span>
                    <span className="text-glass-muted">{formatTime(action.timestamp)}</span>
                  </div>
                  <div className="text-glass-muted">
                    {action.type} • {action.data.listId}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-glass-white-border text-xs text-glass-muted">
            <div>Past: {state.past.length}</div>
            <div>Present: {state.present ? 1 : 0}</div>
            <div>Future: {state.future.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}