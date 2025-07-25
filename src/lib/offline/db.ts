// IndexedDB wrapper for offline storage
export interface OfflineItem {
  id: string
  list_id: string
  name: string
  amount: number
  unit: string
  category: string
  notes: string | null
  image_url: string | null
  is_checked: boolean
  position: number
  created_at: string
  updated_at: string
  sync_status: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete'
  offline_id?: string // For items created offline
}

export interface OfflineList {
  id: string
  user_id: string
  name: string
  description: string | null
  is_shared: boolean
  is_archived: boolean
  share_code: string | null
  created_at: string
  updated_at: string
  sync_status: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete'
  offline_id?: string // For lists created offline
}

export interface OfflineSyncQueue {
  id: string
  operation: 'create' | 'update' | 'delete'
  entity_type: 'list' | 'item'
  entity_id: string
  data: any
  created_at: string
  retry_count: number
}

class OfflineDB {
  private db: IDBDatabase | null = null
  private readonly dbName = 'GlassListOffline'
  private readonly version = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('lists')) {
          const listStore = db.createObjectStore('lists', { keyPath: 'id' })
          listStore.createIndex('user_id', 'user_id', { unique: false })
          listStore.createIndex('sync_status', 'sync_status', { unique: false })
        }

        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' })
          itemStore.createIndex('list_id', 'list_id', { unique: false })
          itemStore.createIndex('sync_status', 'sync_status', { unique: false })
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
          queueStore.createIndex('created_at', 'created_at', { unique: false })
        }
      }
    })
  }

  // List operations
  async saveList(list: OfflineList): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['lists'], 'readwrite')
    const store = transaction.objectStore('lists')
    await this.promisifyRequest(store.put(list))
  }

  async getList(listId: string): Promise<OfflineList | null> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['lists'], 'readonly')
    const store = transaction.objectStore('lists')
    const result = await this.promisifyRequest(store.get(listId))
    return result || null
  }

  async getLists(userId: string): Promise<OfflineList[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['lists'], 'readonly')
    const store = transaction.objectStore('lists')
    const index = store.index('user_id')
    const result = await this.promisifyRequest(index.getAll(userId))
    return result || []
  }

  async deleteList(listId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['lists'], 'readwrite')
    const store = transaction.objectStore('lists')
    await this.promisifyRequest(store.delete(listId))
  }

  // Item operations
  async saveItem(item: OfflineItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['items'], 'readwrite')
    const store = transaction.objectStore('items')
    await this.promisifyRequest(store.put(item))
  }

  async getItem(itemId: string): Promise<OfflineItem | null> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['items'], 'readonly')
    const store = transaction.objectStore('items')
    const result = await this.promisifyRequest(store.get(itemId))
    return result || null
  }

  async getItems(listId: string): Promise<OfflineItem[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['items'], 'readonly')
    const store = transaction.objectStore('items')
    const index = store.index('list_id')
    const result = await this.promisifyRequest(index.getAll(listId))
    return result || []
  }

  async deleteItem(itemId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['items'], 'readwrite')
    const store = transaction.objectStore('items')
    await this.promisifyRequest(store.delete(itemId))
  }

  // Sync queue operations
  async addToSyncQueue(entry: OfflineSyncQueue): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    await this.promisifyRequest(store.add(entry))
  }

  async getSyncQueue(): Promise<OfflineSyncQueue[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['sync_queue'], 'readonly')
    const store = transaction.objectStore('sync_queue')
    const index = store.index('created_at')
    const result = await this.promisifyRequest(index.getAll())
    return result || []
  }

  async removeFromSyncQueue(entryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    await this.promisifyRequest(store.delete(entryId))
  }

  async updateSyncQueueRetry(entryId: string, retryCount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['sync_queue'], 'readwrite')
    const store = transaction.objectStore('sync_queue')
    const entry = await this.promisifyRequest(store.get(entryId))
    if (entry) {
      entry.retry_count = retryCount
      await this.promisifyRequest(store.put(entry))
    }
  }

  // Utility methods
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['lists', 'items', 'sync_queue'], 'readwrite')
    await Promise.all([
      this.promisifyRequest(transaction.objectStore('lists').clear()),
      this.promisifyRequest(transaction.objectStore('items').clear()),
      this.promisifyRequest(transaction.objectStore('sync_queue').clear())
    ])
  }

  async getPendingChanges(): Promise<{ lists: OfflineList[], items: OfflineItem[] }> {
    if (!this.db) throw new Error('Database not initialized')
    
    const transaction = this.db.transaction(['lists', 'items'], 'readonly')
    const listStore = transaction.objectStore('lists')
    const itemStore = transaction.objectStore('items')
    
    const listIndex = listStore.index('sync_status')
    const itemIndex = itemStore.index('sync_status')
    
    const pendingLists = await this.promisifyRequest(
      listIndex.getAll(IDBKeyRange.only('pending_create'))
    )
    const pendingItems = await this.promisifyRequest(
      itemIndex.getAll(IDBKeyRange.only('pending_create'))
    )
    
    return {
      lists: pendingLists || [],
      items: pendingItems || []
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()