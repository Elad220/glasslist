import { offlineStorage, type OfflineRecord } from './storage'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'
import type { Database, ShoppingList, Item } from '@/lib/supabase/types'

interface SyncResult {
  success: boolean
  synced: number
  failed: number
  conflicts: number
  errors: string[]
}

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge'
  resolvedData?: any
}

class SyncManager {
  private syncInProgress = false
  private autoSyncInterval: NodeJS.Timeout | null = null
  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private initialized = false

  private syncStatus: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSync: null,
    pendingChanges: 0,
    syncing: false,
    errors: []
  }

  constructor() {
    // Listen for online/offline events only in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
      
      // Set initial online status
      this.syncStatus.isOnline = navigator.onLine
    }
  }

  // Public API
  async startAutoSync(intervalMs: number = 30000): Promise<void> {
    if (this.initialized) return
    
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval)
    }

    this.autoSyncInterval = setInterval(async () => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncing) {
        // Check authentication before attempting sync
        try {
          const { user, error: authError } = await getCurrentUser()
          if (!authError && user) {
            this.syncAll().catch(console.error)
          }
        } catch (error) {
          // Silent fail for authentication check
        }
      }
    }, intervalMs)

          // Initial sync if online and authenticated
      if (this.syncStatus.isOnline) {
        try {
          const { user, error: authError } = await getCurrentUser()
          if (!authError && user) {
            this.syncAll().catch(console.error)
          }
        } catch (error) {
          // Silent fail for authentication check
        }
      }
    
    this.initialized = true
  }

  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval)
      this.autoSyncInterval = null
    }
  }

  addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    // Send current status immediately
    listener(this.syncStatus)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  async forceSync(): Promise<SyncResult> {
    return await this.syncAll()
  }

  // Main sync orchestration
  private async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: ['Sync already in progress']
      }
    }

    if (!this.syncStatus.isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: ['Device is offline']
      }
    }

    // Check authentication before starting sync
    try {
      const { user, error: authError } = await getCurrentUser()
      if (authError || !user) {
        return {
          success: false,
          synced: 0,
          failed: 0,
          conflicts: 0,
          errors: ['User not authenticated']
        }
      }
    } catch (error) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: ['Authentication failed']
      }
    }

    this.syncInProgress = true
    this.updateSyncStatus({ syncing: true, errors: [] })

    try {
      // First, pull latest data from server
      await this.pullFromServer()

      // Then, push local changes to server
      const result = await this.pushToServer()

      this.updateSyncStatus({
        syncing: false,
        lastSync: new Date().toISOString(),
        pendingChanges: await this.getPendingChangesCount()
      })

      return result
    } catch (error) {
      console.error('Sync failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      
      this.updateSyncStatus({
        syncing: false,
        errors: [errorMessage]
      })

      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: [errorMessage]
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Pull latest data from server and merge with local
  private async pullFromServer(): Promise<void> {
    try {
      // Get current user
      const { user, error: authError } = await getCurrentUser()
      if (authError || !user) throw new Error('User not authenticated')

      if (!supabase) throw new Error('Supabase client not available')

      // Get last sync timestamp
      const syncMetadata = await offlineStorage.getSyncMetadata(user.id)
      const lastSync = syncMetadata?.lastSyncTimestamp || 0

      // Fetch lists updated since last sync
      const { data: lists, error: listsError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', new Date(lastSync).toISOString())

      if (listsError) throw listsError

      // Fetch items updated since last sync
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          shopping_lists!inner(user_id)
        `)
        .eq('shopping_lists.user_id', user.id)
        .gte('updated_at', new Date(lastSync).toISOString())

      if (itemsError) throw itemsError

      // Merge server data with local data
      await this.mergeServerData(lists || [], items || [])

      // Update sync metadata
      await offlineStorage.setSyncMetadata({
        id: user.id,
        lastSyncTimestamp: Date.now(),
        userId: user.id
      })

    } catch (error) {
      console.error('Pull from server failed:', error)
      throw error
    }
  }

  // Push local changes to server
  private async pushToServer(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    }

    try {
      // Get pending changes
      const [pendingLists, pendingItems] = await Promise.all([
        offlineStorage.getPendingSyncLists(),
        offlineStorage.getPendingSyncItems()
      ])

      // Sync lists first
      for (const listRecord of pendingLists) {
        try {
          await this.syncListToServer(listRecord)
          result.synced++
        } catch (error) {
          console.error('Failed to sync list:', listRecord.id, error)
          result.failed++
          result.errors.push(`List ${listRecord.data.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Then sync items
      for (const itemRecord of pendingItems) {
        try {
          await this.syncItemToServer(itemRecord)
          result.synced++
        } catch (error) {
          console.error('Failed to sync item:', itemRecord.id, error)
          result.failed++
          result.errors.push(`Item ${itemRecord.data.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      result.success = result.failed === 0

    } catch (error) {
      console.error('Push to server failed:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  // Merge server data with local data, handling conflicts
  private async mergeServerData(serverLists: ShoppingList[], serverItems: Item[]): Promise<void> {
    // Merge lists
    for (const serverList of serverLists) {
      const localRecord = await offlineStorage.getShoppingList(serverList.id)
      
      if (!localRecord) {
        // New from server, save locally
        await offlineStorage.saveShoppingList(serverList, 'update', false)
      } else if (localRecord.pendingSync) {
        // Conflict: both local and server have changes
        const resolution = await this.resolveListConflict(localRecord, serverList)
        await this.applyListConflictResolution(localRecord, serverList, resolution)
      } else {
        // Server is newer, update local
        await offlineStorage.saveShoppingList(serverList, 'update', false)
      }
    }

    // Merge items
    for (const serverItem of serverItems) {
      const localRecord = await offlineStorage.getItem(serverItem.id)
      
      if (!localRecord) {
        // New from server, save locally
        await offlineStorage.saveItem(serverItem, 'update', false)
      } else if (localRecord.pendingSync) {
        // Conflict: both local and server have changes
        const resolution = await this.resolveItemConflict(localRecord, serverItem)
        await this.applyItemConflictResolution(localRecord, serverItem, resolution)
      } else {
        // Server is newer, update local
        await offlineStorage.saveItem(serverItem, 'update', false)
      }
    }
  }

  // Sync individual list to server
  private async syncListToServer(record: OfflineRecord<ShoppingList>): Promise<void> {
    const { data: list, pendingOperation } = record

    if (!supabase) throw new Error('Supabase client not available')

    try {
      if (pendingOperation === 'create') {
        const { error } = await supabase
          .from('shopping_lists')
          .insert(list)

        if (error) throw error
        await offlineStorage.markListSynced(list.id)

      } else if (pendingOperation === 'update') {
        const { error } = await supabase
          .from('shopping_lists')
          .update(list)
          .eq('id', list.id)

        if (error) throw error
        await offlineStorage.markListSynced(list.id)

      } else if (pendingOperation === 'delete') {
        const { error } = await supabase
          .from('shopping_lists')
          .delete()
          .eq('id', list.id)

        if (error) {
          // Even if server deletion fails, we should still delete locally
          // to maintain consistency with user's action
          console.warn('Server deletion failed for list:', list.id, error)
          await offlineStorage.deleteShoppingList(list.id, false) // Actually delete locally
          // Don't throw error to prevent sync failure
        } else {
          await offlineStorage.deleteShoppingList(list.id, false) // Actually delete locally
        }
      }
    } catch (error) {
      console.error('Failed to sync list to server:', error)
      throw error
    }
  }

  // Sync individual item to server
  private async syncItemToServer(record: OfflineRecord<Item>): Promise<void> {
    const { data: item, pendingOperation } = record

    if (!supabase) throw new Error('Supabase client not available')

    try {
      if (pendingOperation === 'create') {
        const { error } = await supabase
          .from('items')
          .insert(item)

        if (error) throw error
        await offlineStorage.markItemSynced(item.id)

      } else if (pendingOperation === 'update') {
        const { error } = await supabase
          .from('items')
          .update(item)
          .eq('id', item.id)

        if (error) throw error
        await offlineStorage.markItemSynced(item.id)

      } else if (pendingOperation === 'delete') {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', item.id)

        if (error) {
          // Even if server deletion fails, we should still delete locally
          // to maintain consistency with user's action
          console.warn('Server deletion failed for item:', item.id, error)
          await offlineStorage.deleteItem(item.id, false) // Actually delete locally
          // Don't throw error to prevent sync failure
        } else {
          await offlineStorage.deleteItem(item.id, false) // Actually delete locally
        }
      }
    } catch (error) {
      console.error('Failed to sync item to server:', error)
      throw error
    }
  }

  // Conflict resolution strategies
  private async resolveListConflict(
    localRecord: OfflineRecord<ShoppingList>, 
    serverList: ShoppingList
  ): Promise<ConflictResolution> {
    // Simple strategy: prefer local changes for now
    // In a real app, you might want to show a UI for user to choose
    return { strategy: 'local' }
  }

  private async resolveItemConflict(
    localRecord: OfflineRecord<Item>, 
    serverItem: Item
  ): Promise<ConflictResolution> {
    // For items, prefer the most recent change based on is_checked status
    // This handles the common case of checking/unchecking items
    const localTime = new Date(localRecord.data.updated_at).getTime()
    const serverTime = new Date(serverItem.updated_at).getTime()
    
    return { 
      strategy: localTime > serverTime ? 'local' : 'remote' 
    }
  }

  private async applyListConflictResolution(
    localRecord: OfflineRecord<ShoppingList>,
    serverList: ShoppingList,
    resolution: ConflictResolution
  ): Promise<void> {
    if (resolution.strategy === 'local') {
      // Keep local changes, sync to server
      await this.syncListToServer(localRecord)
    } else if (resolution.strategy === 'remote') {
      // Accept server changes
      await offlineStorage.saveShoppingList(serverList, 'update', false)
    }
    // TODO: Handle 'merge' strategy in the future
  }

  private async applyItemConflictResolution(
    localRecord: OfflineRecord<Item>,
    serverItem: Item,
    resolution: ConflictResolution
  ): Promise<void> {
    if (resolution.strategy === 'local') {
      // Keep local changes, sync to server
      await this.syncItemToServer(localRecord)
    } else if (resolution.strategy === 'remote') {
      // Accept server changes
      await offlineStorage.saveItem(serverItem, 'update', false)
    }
    // TODO: Handle 'merge' strategy in the future
  }

  // Event handlers
  private handleOnline(): void {
    this.updateSyncStatus({ isOnline: true })
    // Trigger sync when coming back online
    this.syncAll().catch(console.error)
  }

  private handleOffline(): void {
    this.updateSyncStatus({ isOnline: false })
  }

  // Utility methods
  private async getPendingChangesCount(): Promise<number> {
    try {
      const [pendingLists, pendingItems] = await Promise.all([
        offlineStorage.getPendingSyncLists(),
        offlineStorage.getPendingSyncItems()
      ])
      return pendingLists.length + pendingItems.length
    } catch (error) {
      console.error('Failed to get pending changes count in sync manager:', error)
      // During SSR or when IndexedDB is not available, return 0
      return 0
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates }
    this.listeners.forEach(listener => listener(this.syncStatus))
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSync()
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this))
      window.removeEventListener('offline', this.handleOffline.bind(this))
    }
    this.listeners.clear()
  }
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: string | null
  pendingChanges: number
  syncing: boolean
  errors: string[]
}

// Export singleton instance
export const syncManager = new SyncManager()

export type { SyncResult, ConflictResolution } 