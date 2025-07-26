'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { offlineClient } from './client'
import { syncManager, type SyncStatus } from './sync'
import { offlineStorage } from './storage'

// Hook for sync status monitoring
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus())

  useEffect(() => {
    const unsubscribe = syncManager.addStatusListener((status) => {
      setSyncStatus(status)
    })

    return unsubscribe
  }, [])

  const forceSync = useCallback(async () => {
    return await syncManager.forceSync()
  }, [])

  return {
    ...syncStatus,
    forceSync
  }
}

// Hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true) // Default to true, will be updated in useEffect

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial state based on navigator.onLine
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Hook for pending changes count
export function usePendingChanges() {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const updatePendingCount = useCallback(async () => {
    if (!offlineStorage.isInitialized) {
      setLoading(true)
      return
    }
    try {
      const count = await offlineClient.getPendingChangesCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Failed to get pending changes count:', error)
      setPendingCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!offlineStorage.isInitialized) {
      setLoading(true)
      return
    }
    updatePendingCount()
    // Listen for sync status changes to update count
    const unsubscribe = syncManager.addStatusListener(() => {
      updatePendingCount()
    })
    return unsubscribe
  }, [updatePendingCount])

  return {
    pendingCount,
    loading,
    refresh: updatePendingCount
  }
}

// Hook for shopping lists with offline support
export function useShoppingLists(userId: string | null) {
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLists = useCallback(async () => {
    if (!userId) {
      setLists([])
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await offlineClient.getShoppingLists(userId)
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setLists(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch shopping lists:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch lists')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  // Listen for sync events to refresh data
  useEffect(() => {
    const unsubscribe = syncManager.addStatusListener((status) => {
      // Refresh data when sync completes successfully
      if (!status.syncing && status.lastSync) {
        fetchLists()
      }
    })

    return unsubscribe
  }, [fetchLists])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await fetchLists()
  }, [fetchLists])

  const createList = useCallback(async (listData: any) => {
    try {
      const { data, error: createError } = await offlineClient.createShoppingList(listData)
      
      if (createError) {
        throw new Error(createError)
      }
      
      // Optimistically update local state
      if (data) {
        setLists(prev => [{ ...data, items: [] }, ...prev])
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [])

  const updateList = useCallback(async (listId: string, updates: any) => {
    try {
      const { data, error: updateError } = await offlineClient.updateShoppingList(listId, updates)
      
      if (updateError) {
        throw new Error(updateError)
      }
      
      // Optimistically update local state
      if (data) {
        setLists(prev => prev.map(list => 
          list.id === listId ? { ...list, ...data } : list
        ))
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update list'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [])

  const deleteList = useCallback(async (listId: string) => {
    try {
      const { error: deleteError } = await offlineClient.deleteShoppingList(listId)
      
      if (deleteError) {
        throw new Error(deleteError)
      }
      
      // Optimistically update local state
      setLists(prev => prev.filter(list => list.id !== listId))
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete list'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }, [])

  return {
    lists,
    loading,
    error,
    refreshing,
    refresh,
    createList,
    updateList,
    deleteList
  }
}

// Hook for individual shopping list with items
export function useShoppingList(listId: string | null) {
  const [list, setList] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    if (!listId) {
      setList(null)
      setItems([])
      setLoading(false)
      return
    }

    try {
      const [listResult, itemsResult] = await Promise.all([
        offlineClient.getShoppingList(listId),
        offlineClient.getListItems(listId)
      ])

      if (listResult.error) {
        setError(listResult.error)
        return
      }

      if (itemsResult.error) {
        setError(itemsResult.error)
        return
      }

      setList(listResult.data)
      setItems(itemsResult.data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch shopping list:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch list')
    } finally {
      setLoading(false)
    }
  }, [listId])

  // Initial load
  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Listen for sync events to refresh data
  useEffect(() => {
    const unsubscribe = syncManager.addStatusListener((status) => {
      if (!status.syncing && status.lastSync) {
        fetchList()
      }
    })

    return unsubscribe
  }, [fetchList])

  const createItem = useCallback(async (itemData: any) => {
    try {
      const { data, error: createError } = await offlineClient.createItem(itemData)
      
      if (createError) {
        throw new Error(createError)
      }
      
      // Optimistically update local state
      if (data) {
        setItems(prev => [...prev, data])
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [])

  const updateItem = useCallback(async (itemId: string, updates: any) => {
    try {
      const { data, error: updateError } = await offlineClient.updateItem(itemId, updates)
      
      if (updateError) {
        throw new Error(updateError)
      }
      
      // Optimistically update local state
      if (data) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? data : item
        ))
      }
      
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [])

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const { error: deleteError } = await offlineClient.deleteItem(itemId)
      
      if (deleteError) {
        throw new Error(deleteError)
      }
      
      // Optimistically update local state
      setItems(prev => prev.filter(item => item.id !== itemId))
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }, [])

  const toggleItem = useCallback(async (itemId: string, isChecked: boolean) => {
    return await updateItem(itemId, { is_checked: isChecked })
  }, [updateItem])

  return {
    list,
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    toggleItem,
    refresh: fetchList
  }
}

// Hook for offline-aware data fetching with retry logic
export function useOfflineQuery<T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T | null; error: string | null }>,
  options: {
    enabled?: boolean
    refetchOnSync?: boolean
    staleTime?: number
  } = {}
) {
  const { enabled = true, refetchOnSync = true, staleTime = 5 * 60 * 1000 } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const lastFetchRef = useRef<number>(0)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    const now = Date.now()
    const isStale = now - lastFetchRef.current > staleTime
    
    if (!force && !isStale && data !== null) {
      return // Data is fresh, don't refetch
    }

    setLoading(true)
    
    try {
      const result = await queryFn()
      
      if (result.error) {
        setError(result.error)
      } else {
        setData(result.data)
        setError(null)
        lastFetchRef.current = now
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [enabled, queryFn, staleTime, data])

  // Initial load
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  // Listen for sync events to refetch data
  useEffect(() => {
    if (!refetchOnSync) return

    const unsubscribe = syncManager.addStatusListener((status) => {
      if (!status.syncing && status.lastSync) {
        fetchData(true) // Force refetch after sync
      }
    })

    return unsubscribe
  }, [fetchData, refetchOnSync])

  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch
  }
}

// Hook for debounced actions (useful for auto-save functionality)
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [(...args: any[]) => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef<any>(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [debouncedCallback, cancel]
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const performOptimisticUpdate = useCallback(
    async <R>(
      newData: T,
      asyncAction: () => Promise<R>
    ): Promise<R> => {
      // Apply optimistic update
      setOptimisticData(newData)
      setIsOptimistic(true)

      try {
        // Perform the actual action
        const result = await asyncAction()
        
        // Clear optimistic state on success
        setOptimisticData(null)
        setIsOptimistic(false)
        
        return result
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticData(null)
        setIsOptimistic(false)
        
        throw error
      }
    },
    []
  )

  return {
    optimisticData,
    isOptimistic,
    performOptimisticUpdate
  }
} 