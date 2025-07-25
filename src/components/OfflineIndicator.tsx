'use client'

import { useState } from 'react'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Cloud,
  CloudOff
} from 'lucide-react'
import { useOfflineSync } from '@/lib/offline/hooks'

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingChanges, lastSyncTime, syncError, syncAll } = useOfflineSync()
  const [showDetails, setShowDetails] = useState(false)

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="glass-card p-3 shadow-lg border-2 border-orange-200/50 bg-orange-50/20">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Offline Mode</span>
            {pendingChanges > 0 && (
              <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingChanges}
              </div>
            )}
          </div>
          {pendingChanges > 0 && (
            <p className="text-xs text-orange-600 mt-1">
              {pendingChanges} change{pendingChanges > 1 ? 's' : ''} will sync when online
            </p>
          )}
        </div>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="glass-card p-3 shadow-lg border-2 border-blue-200/50 bg-blue-50/20">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-700">Syncing...</span>
          </div>
        </div>
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="glass-card p-3 shadow-lg border-2 border-red-200/50 bg-red-50/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Sync Error</span>
            <button
              onClick={syncAll}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
          <p className="text-xs text-red-600 mt-1 truncate max-w-48">
            {syncError}
          </p>
        </div>
      </div>
    )
  }

  if (pendingChanges > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="glass-card p-3 shadow-lg border-2 border-yellow-200/50 bg-yellow-50/20">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">
              {pendingChanges} pending change{pendingChanges > 1 ? 's' : ''}
            </span>
            <button
              onClick={syncAll}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
            >
              Sync Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className="glass-card p-3 shadow-lg border-2 border-green-200/50 bg-green-50/20 cursor-pointer hover:bg-green-50/30 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Online</span>
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-green-200/50">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Clock className="w-3 h-3" />
              <span>Last sync: {formatLastSync(lastSyncTime)}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                syncAll()
              }}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors mt-1"
            >
              Sync Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function OfflineBanner() {
  const { isOnline, pendingChanges } = useOfflineSync()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-3 text-center shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="font-medium">You're offline</span>
        {pendingChanges > 0 && (
          <span className="text-sm opacity-90">
            • {pendingChanges} change{pendingChanges > 1 ? 's' : ''} pending
          </span>
        )}
      </div>
      <p className="text-sm opacity-90 mt-1">
        Your changes are saved locally and will sync when you're back online
      </p>
    </div>
  )
}