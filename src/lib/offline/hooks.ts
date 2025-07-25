import { useState, useEffect } from 'react'
import { syncService, SyncStatus } from './sync'

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus())

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus)
    return unsubscribe
  }, [])

  return {
    ...syncStatus,
    syncAll: () => syncService.syncAll(),
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingChanges: syncStatus.pendingChanges,
    lastSyncTime: syncStatus.lastSyncTime,
    syncError: syncStatus.syncError
  }
}

export function useOfflineCapability() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if IndexedDB is supported
    const checkSupport = () => {
      const hasIndexedDB = 'indexedDB' in window
      const hasServiceWorker = 'serviceWorker' in navigator
      setIsSupported(hasIndexedDB && hasServiceWorker)
    }

    checkSupport()
  }, [])

  return isSupported
}