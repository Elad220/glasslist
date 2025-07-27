'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: ToastAction
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
  success: (title: string, message?: string, options?: { action?: ToastAction }) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  toast: {
    success: (title: string, message?: string, options?: { action?: ToastAction }) => void
    error: (title: string, message?: string) => void
    warning: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    const duration = toast.duration || 4000
    setTimeout(() => {
      hideToast(id)
    }, duration)
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string, options?: { action?: ToastAction }) => {
    showToast({ type: 'success', title, message, action: options?.action })
  }, [showToast])

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 6000 })
  }, [showToast])

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 5000 })
  }, [showToast])

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      showToast, 
      hideToast, 
      success, 
      error, 
      warning, 
      info,
      toast: { success, error, warning, info }
    }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[], onHide: (id: string) => void }) {
  if (toasts.length === 0) return null

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getColors = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200/50 bg-green-50/80'
      case 'error':
        return 'border-red-200/50 bg-red-50/80'
      case 'warning':
        return 'border-yellow-200/50 bg-yellow-50/80'
      case 'info':
        return 'border-blue-200/50 bg-blue-50/80'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-card p-4 border-2 ${getColors(toast.type)} shadow-xl animate-in slide-in-from-right-full duration-300`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-glass-heading text-sm">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-glass-muted text-xs mt-1">
                  {toast.message}
                </p>
              )}
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick()
                    onHide(toast.id)
                  }}
                  className="mt-2 px-3 py-1.5 bg-primary/20 text-primary text-xs font-medium rounded-lg hover:bg-primary/30 transition-colors"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onHide(toast.id)}
              className="flex-shrink-0 p-1 hover:bg-glass-white-light rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-glass-muted" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 