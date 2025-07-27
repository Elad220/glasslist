'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Upload,
  X
} from 'lucide-react'
import { useSyncStatus, useOnlineStatus, usePendingChanges } from '@/lib/offline/hooks'

interface OfflineIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showDetails?: boolean
  className?: string
}

// Utility hook to detect client-side rendering
function useIsClient() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  return isClient
}

export default function OfflineIndicator({ 
  position = 'top-right', 
  showDetails = false,
  className = '' 
}: OfflineIndicatorProps) {
  // All hooks always called in the same order
  const isClient = useIsClient()
  const [showDetailsPanel, setShowDetailsPanel] = useState(showDetails)
  const [justWentOnline, setJustWentOnline] = useState(false)
  const isOnline = useOnlineStatus()
  const { isOnline: syncOnline, syncing, lastSync, pendingChanges, errors, forceSync } = useSyncStatus()
  const { pendingCount } = usePendingChanges()

  // Track when we go from offline to online
  useEffect(() => {
    if (isOnline && !justWentOnline) {
      setJustWentOnline(true)
      // Reset after 3 seconds
      const timer = setTimeout(() => setJustWentOnline(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, justWentOnline])

  // Only render after client-side mount
  if (!isClient) return null

  const getStatus = () => {
    if (!isOnline) return 'offline'
    if (syncing) return 'syncing'
    if (errors.length > 0) return 'error'
    if (pendingCount > 0) return 'pending'
    return 'synced'
  }

  const getStatusConfig = () => {
    const status = getStatus()
    
    switch (status) {
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          label: 'Offline',
          description: 'Working offline. Changes will sync when online.'
        }
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          label: 'Syncing',
          description: 'Syncing your changes...',
          animate: true
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          label: 'Sync Error',
          description: 'Some changes failed to sync. Tap to retry.'
        }
      case 'pending':
        return {
          icon: Upload,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30',
          label: `${pendingCount} Pending`,
          description: `${pendingCount} change${pendingCount !== 1 ? 's' : ''} waiting to sync.`
        }
      case 'synced':
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          label: 'Synced',
          description: lastSync ? `Last sync: ${formatLastSync()}` : 'All changes synced.'
        }
    }
  }

  const handleIndicatorClick = () => {
    if (getStatus() === 'error') {
      forceSync()
    } else {
      setShowDetailsPanel(!showDetailsPanel)
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return 'Never'
    const date = new Date(lastSync)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const statusConfig = getStatusConfig()
  const Icon = statusConfig.icon

  return (
    <div className={`fixed z-50 ${getPositionClasses(position)} ${className}`}>
      {/* Main indicator */}
      <div
        onClick={handleIndicatorClick}
        className={`
          glass-card cursor-pointer transition-all duration-200 hover:scale-105
          ${statusConfig.bgColor} ${statusConfig.borderColor}
          border rounded-lg p-3 shadow-lg backdrop-blur-md
        `}
      >
        <div className="flex items-center gap-3">
          <Icon 
            className={`w-5 h-5 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} 
          />
          <div className="min-w-0">
            <div className={`text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </div>
            <div className="text-xs text-gray-300 opacity-80">
              {statusConfig.description}
            </div>
          </div>
        </div>
      </div>

      {/* Details panel */}
      {showDetailsPanel && (
        <div className="glass-card mt-2 p-4 rounded-lg border border-white/20 backdrop-blur-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-glass-heading">Sync Status</span>
              <button
                onClick={() => setShowDetailsPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Connection:</span>
                <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Sync Status:</span>
                <span className={syncing ? 'text-blue-400' : 'text-green-400'}>
                  {syncing ? 'Syncing...' : 'Idle'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Pending Changes:</span>
                <span className="text-orange-400">{pendingCount}</span>
              </div>
              
              {lastSync && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Sync:</span>
                  <span className="text-gray-300">{formatLastSync()}</span>
                </div>
              )}
              
              {errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded">
                  <div className="text-red-400 text-xs font-medium mb-1">Errors:</div>
                  {errors.map((error, index) => (
                    <div key={index} className="text-red-300 text-xs">{error}</div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => forceSync()}
                disabled={syncing || !isOnline}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-500/20 border border-blue-500/30 
                         text-blue-300 rounded hover:bg-blue-500/30 disabled:opacity-50 
                         disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? 'Syncing...' : 'Force Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getPositionClasses(position: string) {
  switch (position) {
    case 'top-left': return 'top-4 left-4'
    case 'top-right': return 'top-4 right-4'
    case 'bottom-left': return 'bottom-4 left-4'
    case 'bottom-right': return 'bottom-4 right-4'
    default: return 'top-4 right-4'
  }
}

export function CompactOfflineIndicator({ className = '' }: { className?: string }) {
  const isClient = useIsClient()
  const isOnline = useOnlineStatus()
  const { syncing, pendingChanges } = useSyncStatus()
  const { pendingCount } = usePendingChanges()
  
  if (!isClient) return null

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-400'
    if (syncing) return 'text-blue-400'
    if (pendingCount > 0) return 'text-orange-400'
    return 'text-green-400'
  }

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff
    if (syncing) return RefreshCw
    if (pendingCount > 0) return Upload
    return CheckCircle
  }

  const Icon = getStatusIcon()

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Icon className={`w-4 h-4 ${getStatusColor()} ${syncing ? 'animate-spin' : ''}`} />
      {pendingCount > 0 && (
        <span className="text-xs text-orange-400 font-medium">
          {pendingCount}
        </span>
      )}
    </div>
  )
}

export function SyncNotification() {
  // All hooks always called in the same order
  const isClient = useIsClient()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState<'success' | 'error' | null>(null)
  const { syncing, lastSync, errors } = useSyncStatus()
  const { pendingCount } = usePendingChanges()
  const lastSyncRef = useRef<string | null>(null)
  const prevSyncingRef = useRef<boolean | undefined>(undefined)
  const prevPendingCountRef = useRef<number | undefined>(undefined)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isClient) return
    if (errors.length > 0 && !showNotification) {
      setNotificationType('error')
      setShowNotification(true)
      
      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      
      timerRef.current = setTimeout(() => setShowNotification(false), 5000)
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    }
  }, [errors, showNotification, isClient])

  useEffect(() => {
    if (!isClient) return
    
    // Initialize refs on first render
    if (prevSyncingRef.current === undefined) {
      prevSyncingRef.current = syncing
      prevPendingCountRef.current = pendingCount
      return
    }

    // Detect sync completion with resolved changes
    const wasSyncing = prevSyncingRef.current
    const previousPending = prevPendingCountRef.current || 0
    const hadPendingChanges = previousPending > 0
    const changesWereResolved = pendingCount < previousPending

    if (wasSyncing && !syncing && hadPendingChanges && changesWereResolved && !showNotification) {
      console.log('Sync completed with changes - showing notification:', { 
        wasSyncing, 
        hadPendingChanges, 
        prevCount: previousPending, 
        newCount: pendingCount 
      })
      
      setNotificationType('success')
      setShowNotification(true)
      
      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      
      // Dismiss after 6 seconds
      timerRef.current = setTimeout(() => {
        setShowNotification(false)
        console.log('Hiding sync complete notification')
      }, 6000)
    }

    // Update refs for next comparison
    prevSyncingRef.current = syncing
    prevPendingCountRef.current = pendingCount
  }, [syncing, pendingCount, showNotification, isClient])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  if (!isClient || !showNotification) return null

  const isError = notificationType === 'error'
  const Icon = isError ? AlertCircle : CheckCircle

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        glass-card flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md
        ${isError ? 'border-red-500/30 bg-red-500/20' : 'border-green-500/30 bg-green-500/20'}
      `}>
        <Icon className={`w-5 h-5 ${isError ? 'text-red-400' : 'text-green-400'}`} />
        <div>
          <div className={`text-sm font-medium ${isError ? 'text-red-300' : 'text-green-300'}`}>
            {isError ? 'Sync Error' : 'Sync Complete'}
          </div>
          <div className="text-xs text-gray-300">
            {isError ? errors[0] : 'All changes synced successfully'}
          </div>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 