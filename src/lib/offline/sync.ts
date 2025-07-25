import { offlineDB, OfflineList, OfflineItem, OfflineSyncQueue } from './db'
import { 
  getShoppingLists, 
  getShoppingList, 
  getListItems, 
  createItem, 
  updateItem, 
  deleteItem, 
  toggleItemChecked,
  createManyItems,
  updateShoppingList,
  deleteShoppingList,
  isDemoMode
} from '@/lib/supabase/client'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  pendingChanges: number
  syncError: string | null
}

class SyncService {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncError: null
  }
  private listeners: ((status: SyncStatus) => void)[] = []
  private syncInterval: NodeJS.Timeout | null = null
  private retryTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Initialize offline database
    await offlineDB.init()
    
    // Set up online/offline listeners
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Start periodic sync
    this.startPeriodicSync()
    
    // Initial sync check
    this.updatePendingChanges()
  }

  // Status management
  getStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    listener(this.syncStatus)
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates }
    this.listeners.forEach(listener => listener(this.syncStatus))
  }

  // Online/Offline handling
  private handleOnline() {
    this.updateStatus({ isOnline: true, syncError: null })
    this.syncAll()
  }

  private handleOffline() {
    this.updateStatus({ isOnline: false })
  }

  // Sync operations
  async syncAll(): Promise<void> {
    if (isDemoMode || !this.syncStatus.isOnline || this.syncStatus.isSyncing) {
      return
    }

    this.updateStatus({ isSyncing: true, syncError: null })

    try {
      // Sync pending changes
      await this.syncPendingChanges()
      
      // Update last sync time
      this.updateStatus({ 
        lastSyncTime: new Date().toISOString(),
        isSyncing: false 
      })
      
      // Update pending changes count
      await this.updatePendingChanges()
      
    } catch (error) {
      console.error('Sync failed:', error)
      this.updateStatus({ 
        isSyncing: false, 
        syncError: error instanceof Error ? error.message : 'Sync failed' 
      })
      
      // Retry after delay
      this.scheduleRetry()
    }
  }

  private async syncPendingChanges(): Promise<void> {
    const queue = await offlineDB.getSyncQueue()
    
    for (const entry of queue) {
      try {
        await this.processSyncEntry(entry)
        await offlineDB.removeFromSyncQueue(entry.id)
      } catch (error) {
        console.error(`Failed to sync entry ${entry.id}:`, error)
        
        // Increment retry count
        const newRetryCount = entry.retry_count + 1
        if (newRetryCount >= 3) {
          // Remove from queue after 3 retries
          await offlineDB.removeFromSyncQueue(entry.id)
        } else {
          await offlineDB.updateSyncQueueRetry(entry.id, newRetryCount)
        }
      }
    }
  }

  private async processSyncEntry(entry: OfflineSyncQueue): Promise<void> {
    switch (entry.operation) {
      case 'create':
        if (entry.entity_type === 'list') {
          await this.syncCreateList(entry.data)
        } else {
          await this.syncCreateItem(entry.data)
        }
        break
      case 'update':
        if (entry.entity_type === 'list') {
          await this.syncUpdateList(entry.entity_id, entry.data)
        } else {
          await this.syncUpdateItem(entry.entity_id, entry.data)
        }
        break
      case 'delete':
        if (entry.entity_type === 'list') {
          await this.syncDeleteList(entry.entity_id)
        } else {
          await this.syncDeleteItem(entry.entity_id)
        }
        break
    }
  }

  private async syncCreateList(listData: any): Promise<void> {
    const { data: createdList, error } = await updateShoppingList(listData.id, listData)
    if (error) throw new Error(`Failed to create list: ${error}`)
    
    // Update local record with server ID
    const offlineList = await offlineDB.getList(listData.id)
    if (offlineList) {
      offlineList.sync_status = 'synced'
      await offlineDB.saveList(offlineList)
    }
  }

  private async syncCreateItem(itemData: any): Promise<void> {
    const { data: createdItem, error } = await createItem(itemData)
    if (error) throw new Error(`Failed to create item: ${error}`)
    
    // Update local record with server ID
    const offlineItem = await offlineDB.getItem(itemData.id)
    if (offlineItem) {
      offlineItem.sync_status = 'synced'
      await offlineDB.saveItem(offlineItem)
    }
  }

  private async syncUpdateList(listId: string, updates: any): Promise<void> {
    const { error } = await updateShoppingList(listId, updates)
    if (error) throw new Error(`Failed to update list: ${error}`)
    
    // Update local record
    const offlineList = await offlineDB.getList(listId)
    if (offlineList) {
      offlineList.sync_status = 'synced'
      await offlineDB.saveList(offlineList)
    }
  }

  private async syncUpdateItem(itemId: string, updates: any): Promise<void> {
    const { error } = await updateItem(itemId, updates)
    if (error) throw new Error(`Failed to update item: ${error}`)
    
    // Update local record
    const offlineItem = await offlineDB.getItem(itemId)
    if (offlineItem) {
      offlineItem.sync_status = 'synced'
      await offlineDB.saveItem(offlineItem)
    }
  }

  private async syncDeleteList(listId: string): Promise<void> {
    const { error } = await deleteShoppingList(listId)
    if (error) throw new Error(`Failed to delete list: ${error}`)
    
    // Remove from local storage
    await offlineDB.deleteList(listId)
  }

  private async syncDeleteItem(itemId: string): Promise<void> {
    const { error } = await deleteItem(itemId)
    if (error) throw new Error(`Failed to delete item: ${error}`)
    
    // Remove from local storage
    await offlineDB.deleteItem(itemId)
  }

  // Offline operations
  async createListOffline(listData: Omit<OfflineList, 'id' | 'sync_status'>): Promise<string> {
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const list: OfflineList = {
      ...listData,
      id: offlineId,
      sync_status: 'pending_create'
    }
    
    await offlineDB.saveList(list)
    
    // Add to sync queue
    await offlineDB.addToSyncQueue({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: 'create',
      entity_type: 'list',
      entity_id: offlineId,
      data: list,
      created_at: new Date().toISOString(),
      retry_count: 0
    })
    
    await this.updatePendingChanges()
    return offlineId
  }

  async updateListOffline(listId: string, updates: Partial<OfflineList>): Promise<void> {
    const list = await offlineDB.getList(listId)
    if (!list) throw new Error('List not found')
    
    const updatedList: OfflineList = {
      ...list,
      ...updates,
      sync_status: 'pending_update'
    }
    
    await offlineDB.saveList(updatedList)
    
    // Add to sync queue
    await offlineDB.addToSyncQueue({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: 'update',
      entity_type: 'list',
      entity_id: listId,
      data: updates,
      created_at: new Date().toISOString(),
      retry_count: 0
    })
    
    await this.updatePendingChanges()
  }

  async deleteListOffline(listId: string): Promise<void> {
    // Add to sync queue first
    await offlineDB.addToSyncQueue({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: 'delete',
      entity_type: 'list',
      entity_id: listId,
      data: null,
      created_at: new Date().toISOString(),
      retry_count: 0
    })
    
    // Then remove from local storage
    await offlineDB.deleteList(listId)
    await this.updatePendingChanges()
  }

  async createItemOffline(itemData: Omit<OfflineItem, 'id' | 'sync_status'>): Promise<string> {
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const item: OfflineItem = {
      ...itemData,
      id: offlineId,
      sync_status: 'pending_create'
    }
    
    await offlineDB.saveItem(item)
    
    // Add to sync queue
    await offlineDB.addToSyncQueue({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: 'create',
      entity_type: 'item',
      entity_id: offlineId,
      data: item,
      created_at: new Date().toISOString(),
      retry_count: 0
    })
    
    await this.updatePendingChanges()
    return offlineId
  }

  async updateItemOffline(itemId: string, updates: Partial<OfflineItem>): Promise<void> {
    const item = await offlineDB.getItem(itemId)
    if (!item) throw new Error('Item not found')
    
    const updatedItem: OfflineItem = {
      ...item,
      ...updates,
      sync_status: 'pending_update'
    }
    
    await offlineDB.saveItem(updatedItem)
    
    // Add to sync queue
    await offlineDB.addToSyncQueue({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: 'update',
      entity_type: 'item',
      entity_id: itemId,
      data: updates,
      created_at: new Date().toISOString(),
      retry_count: 0
    })
    
    await this.updatePendingChanges()
  }

  async deleteItemOffline(itemId: string): Promise<void> {
    // Add to sync queue first
    await offlineDB.addToSyncQueue({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: 'delete',
      entity_type: 'item',
      entity_id: itemId,
      data: null,
      created_at: new Date().toISOString(),
      retry_count: 0
    })
    
    // Then remove from local storage
    await offlineDB.deleteItem(itemId)
    await this.updatePendingChanges()
  }

  // Data retrieval (with offline fallback)
  async getListsOffline(userId: string): Promise<OfflineList[]> {
    return await offlineDB.getLists(userId)
  }

  async getListOffline(listId: string): Promise<OfflineList | null> {
    return await offlineDB.getList(listId)
  }

  async getItemsOffline(listId: string): Promise<OfflineItem[]> {
    return await offlineDB.getItems(listId)
  }

  async getItemOffline(itemId: string): Promise<OfflineItem | null> {
    return await offlineDB.getItem(itemId)
  }

  // Utility methods
  private async updatePendingChanges(): Promise<void> {
    const queue = await offlineDB.getSyncQueue()
    this.updateStatus({ pendingChanges: queue.length })
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncAll()
      }
    }, 30000)
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
    
    this.retryTimeout = setTimeout(() => {
      if (this.syncStatus.isOnline) {
        this.syncAll()
      }
    }, 5000) // Retry after 5 seconds
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }
}

export const syncService = new SyncService()