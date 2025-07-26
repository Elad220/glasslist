import type { ShoppingList, Item, NewShoppingList, NewItem, UpdateShoppingList, UpdateItem } from '@/lib/supabase/types'

interface OfflineRecord<T> {
  id: string
  data: T
  lastModified: number
  pendingSync?: boolean
  pendingOperation?: 'create' | 'update' | 'delete'
  conflictData?: T // Store conflicting server data for resolution
}

interface SyncMetadata {
  id: string
  lastSyncTimestamp: number
  userId: string
}

// Global flag to disable IndexedDB operations
const DISABLE_INDEXEDDB = false;

// Helper to generate a UUID (v4)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: manual UUID v4
  // https://stackoverflow.com/a/2117523/329700
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

class OfflineStorage {
  private dbName = 'glasslist-offline'
  private version = 2 // Bump version to force schema reset
  private db: IDBDatabase | null = null
  public isInitialized = false;
  public initPromise: Promise<void> | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
  }

  async init(): Promise<void> {
    if (DISABLE_INDEXEDDB) {
      this.isInitialized = true;
      return Promise.resolve();
    }
    if (this.isInitialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      // Migration: delete old DB if exists to ensure clean schema
      if (typeof window !== 'undefined') {
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(this.dbName)
          req.onsuccess = req.onerror = req.onblocked = () => resolve()
        })
      }
      if (!this.isBrowser()) {
        console.warn('IndexedDB not available in SSR environment')
        return
      }

      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          this.db = request.result
          // Clean up any records with invalid pendingSync
          this.cleanupPendingSync().then(() => {
            this.isInitialized = true;
            resolve()
          }).catch((error) => {
            console.error('Error during cleanup:', error)
            this.isInitialized = true;
            resolve()
          })
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Shopping lists store
          if (!db.objectStoreNames.contains('shopping_lists')) {
            const listsStore = db.createObjectStore('shopping_lists', { keyPath: 'id' })
            listsStore.createIndex('userId', 'data.user_id', { unique: false })
            listsStore.createIndex('lastModified', 'lastModified', { unique: false })
            listsStore.createIndex('pendingSync', 'pendingSync', { unique: false })
          }

          // Items store
          if (!db.objectStoreNames.contains('items')) {
            const itemsStore = db.createObjectStore('items', { keyPath: 'id' })
            itemsStore.createIndex('listId', 'data.list_id', { unique: false })
            itemsStore.createIndex('lastModified', 'lastModified', { unique: false })
            itemsStore.createIndex('pendingSync', 'pendingSync', { unique: false })
          }

          // Sync metadata store
          if (!db.objectStoreNames.contains('sync_metadata')) {
            db.createObjectStore('sync_metadata', { keyPath: 'id' })
          }
        }
      })
    })();
    return this.initPromise;
  }

  // Clean up any records with invalid pendingSync
  private async cleanupPendingSync(): Promise<void> {
    if (!this.db) return
    
    try {
      // Clean up shopping lists
      const tx1 = this.db.transaction(['shopping_lists'], 'readwrite')
      const store1 = tx1.objectStore('shopping_lists')
      const getAllReq1 = store1.getAll()
      
      await new Promise<void>((resolve, reject) => {
        getAllReq1.onsuccess = () => {
          try {
            (getAllReq1.result as any[]).forEach(record => {
              if (typeof record.pendingSync !== 'boolean') {
                record.pendingSync = false
                store1.put(record)
              }
            })
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        getAllReq1.onerror = () => reject(getAllReq1.error)
      })

      // Clean up items
      const tx2 = this.db.transaction(['items'], 'readwrite')
      const store2 = tx2.objectStore('items')
      const getAllReq2 = store2.getAll()
      
      await new Promise<void>((resolve, reject) => {
        getAllReq2.onsuccess = () => {
          try {
            (getAllReq2.result as any[]).forEach(record => {
              if (typeof record.pendingSync !== 'boolean') {
                record.pendingSync = false
                store2.put(record)
              }
            })
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        getAllReq2.onerror = () => reject(getAllReq2.error)
      })
    } catch (error) {
      console.error('Error during cleanupPendingSync:', error)
    }
  }

  private ensureDB(): IDBDatabase {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call init() first.')
    }
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.db
  }

  // Shopping Lists operations
  async getShoppingLists(userId: string): Promise<OfflineRecord<ShoppingList>[]> {
    if (DISABLE_INDEXEDDB) return [];
    if (!this.isInitialized) return [];
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shopping_lists'], 'readonly')
      const store = transaction.objectStore('shopping_lists')
      const index = store.index('userId')
      const request = index.getAll(userId)

      request.onsuccess = () => {
        const records = request.result as OfflineRecord<ShoppingList>[]
        // Filter out deleted items (for local deletions)
        const activeRecords = records.filter(record => record.pendingOperation !== 'delete')
        resolve(activeRecords)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getShoppingList(listId: string): Promise<OfflineRecord<ShoppingList> | null> {
    if (DISABLE_INDEXEDDB) return null;
    if (!this.isInitialized) return null;
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shopping_lists'], 'readonly')
      const store = transaction.objectStore('shopping_lists')
      const request = store.get(listId)

      request.onsuccess = () => {
        const record = request.result as OfflineRecord<ShoppingList> | undefined
        if (record && record.pendingOperation === 'delete') {
          resolve(null) // Don't return deleted items
        } else {
          resolve(record || null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async saveShoppingList(
    list: ShoppingList | NewShoppingList, 
    operation: 'create' | 'update' = 'update',
    needsSync: boolean = true
  ): Promise<OfflineRecord<ShoppingList> | null> {
    if (DISABLE_INDEXEDDB) return null;
    if (!this.isInitialized) return null;
    const db = this.ensureDB()
    const timestamp = Date.now()
    
    const listId = ('id' in list && list.id) ? list.id : generateUUID()
    const record: OfflineRecord<ShoppingList> = {
      id: listId,
      data: {
        id: listId,
        user_id: list.user_id,
        name: list.name,
        description: list.description || null,
        is_archived: list.is_archived || false,
        category_order: list.category_order || null,
        is_shared: list.is_shared || false,
        share_code: list.share_code || null,
        created_by: list.created_by || null,
        created_at: 'created_at' in list ? list.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as ShoppingList,
      lastModified: timestamp,
      pendingSync: !!needsSync,
      pendingOperation: needsSync ? operation : undefined
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shopping_lists'], 'readwrite')
      const store = transaction.objectStore('shopping_lists')
      const request = store.put(record)

      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteShoppingList(listId: string, needsSync: boolean = true): Promise<void> {
    if (DISABLE_INDEXEDDB) return;
    if (!this.isInitialized) return;
    const db = this.ensureDB()
    
    if (needsSync) {
      // Mark for deletion instead of actually deleting
      const existingRecord = await this.getShoppingList(listId)
      if (existingRecord) {
        const record: OfflineRecord<ShoppingList> = {
          ...existingRecord,
          lastModified: Date.now(),
          pendingSync: true,
          pendingOperation: 'delete'
        }

        return new Promise((resolve, reject) => {
          const transaction = db.transaction(['shopping_lists'], 'readwrite')
          const store = transaction.objectStore('shopping_lists')
          const request = store.put(record)

          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    } else {
      // Actually delete from local storage
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['shopping_lists'], 'readwrite')
        const store = transaction.objectStore('shopping_lists')
        const request = store.delete(listId)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  // Items operations
  async getListItems(listId: string): Promise<OfflineRecord<Item>[]> {
    if (DISABLE_INDEXEDDB) return [];
    if (!this.isInitialized) return [];
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['items'], 'readonly')
      const store = transaction.objectStore('items')
      const index = store.index('listId')
      const request = index.getAll(listId)

      request.onsuccess = () => {
        const records = request.result as OfflineRecord<Item>[]
        // Filter out deleted items
        const activeRecords = records.filter(record => record.pendingOperation !== 'delete')
        resolve(activeRecords)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getItem(itemId: string): Promise<OfflineRecord<Item> | null> {
    if (DISABLE_INDEXEDDB) return null;
    if (!this.isInitialized) return null;
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['items'], 'readonly')
      const store = transaction.objectStore('items')
      const request = store.get(itemId)

      request.onsuccess = () => {
        const record = request.result as OfflineRecord<Item> | undefined
        if (record && record.pendingOperation === 'delete') {
          resolve(null)
        } else {
          resolve(record || null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async saveItem(
    item: Item | NewItem,
    operation: 'create' | 'update' = 'update', 
    needsSync: boolean = true
  ): Promise<OfflineRecord<Item> | null> {
    if (DISABLE_INDEXEDDB) return null;
    if (!this.isInitialized) return null;
    const db = this.ensureDB()
    const timestamp = Date.now()
    
    const itemId = ('id' in item && item.id) ? item.id : generateUUID()
    const record: OfflineRecord<Item> = {
      id: itemId,
      data: {
        id: itemId,
        list_id: item.list_id,
        name: item.name,
        amount: item.amount || 1,
        unit: item.unit || 'pcs',
        category: item.category || 'Other',
        notes: item.notes || null,
        image_url: item.image_url || null,
        is_checked: item.is_checked || false,
        position: item.position || 0,
        created_at: 'created_at' in item ? item.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Item,
      lastModified: timestamp,
      pendingSync: !!needsSync,
      pendingOperation: needsSync ? operation : undefined
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['items'], 'readwrite')
      const store = transaction.objectStore('items')
      const request = store.put(record)

      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteItem(itemId: string, needsSync: boolean = true): Promise<void> {
    if (DISABLE_INDEXEDDB) return;
    if (!this.isInitialized) return;
    const db = this.ensureDB()
    
    if (needsSync) {
      // Mark for deletion
      const existingRecord = await this.getItem(itemId)
      if (existingRecord) {
        const record: OfflineRecord<Item> = {
          ...existingRecord,
          lastModified: Date.now(),
          pendingSync: true,
          pendingOperation: 'delete'
        }

        return new Promise((resolve, reject) => {
          const transaction = db.transaction(['items'], 'readwrite')
          const store = transaction.objectStore('items')
          const request = store.put(record)

          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    } else {
      // Actually delete
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['items'], 'readwrite')
        const store = transaction.objectStore('items')
        const request = store.delete(itemId)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  // Sync metadata operations
  async getSyncMetadata(userId: string): Promise<SyncMetadata | null> {
    if (DISABLE_INDEXEDDB) return null;
    if (!this.isInitialized) return null;
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_metadata'], 'readonly')
      const store = transaction.objectStore('sync_metadata')
      const request = store.get(userId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async setSyncMetadata(metadata: SyncMetadata): Promise<void> {
    if (DISABLE_INDEXEDDB) return;
    if (!this.isInitialized) return;
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sync_metadata'], 'readwrite')
      const store = transaction.objectStore('sync_metadata')
      const request = store.put(metadata)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get all pending sync operations
  async getPendingSyncLists(): Promise<OfflineRecord<ShoppingList>[]> {
    if (DISABLE_INDEXEDDB) return [];
    if (!this.isInitialized) return [];
    try {
      if (typeof window === 'undefined') return []
      const db = this.ensureDB()
      if (!db.objectStoreNames.contains('shopping_lists')) return []
      const transaction = db.transaction(['shopping_lists'], 'readonly')
      const store = transaction.objectStore('shopping_lists')
      if (!Array.from(store.indexNames).includes('pendingSync')) return []
      
      // Try to get all records and filter manually instead of using index
      const request = store.getAll()
      return await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          try {
            const allRecords = request.result as OfflineRecord<ShoppingList>[]
            const pendingRecords = allRecords.filter(record => 
              record.pendingSync === true
            )
            resolve(pendingRecords)
          } catch (error) {
            console.error('Error filtering pending lists:', error)
            resolve([])
          }
        }
        request.onerror = () => resolve([])
      })
    } catch (e) {
      console.error('getPendingSyncLists DataError:', e)
      return []
    }
  }

  async getPendingSyncItems(): Promise<OfflineRecord<Item>[]> {
    if (DISABLE_INDEXEDDB) return [];
    if (!this.isInitialized) return [];
    try {
      if (typeof window === 'undefined') return []
      const db = this.ensureDB()
      if (!db.objectStoreNames.contains('items')) return []
      const transaction = db.transaction(['items'], 'readonly')
      const store = transaction.objectStore('items')
      if (!Array.from(store.indexNames).includes('pendingSync')) return []
      
      // Try to get all records and filter manually instead of using index
      const request = store.getAll()
      return await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          try {
            const allRecords = request.result as OfflineRecord<Item>[]
            const pendingRecords = allRecords.filter(record => 
              record.pendingSync === true
            )
            resolve(pendingRecords)
          } catch (error) {
            console.error('Error filtering pending items:', error)
            resolve([])
          }
        }
        request.onerror = () => resolve([])
      })
    } catch (e) {
      console.error('getPendingSyncItems DataError:', e)
      return []
    }
  }

  // Mark record as synced
  async markListSynced(listId: string): Promise<void> {
    const record = await this.getShoppingList(listId)
    if (record) {
      record.pendingSync = false
      record.pendingOperation = undefined
      await this.saveShoppingList(record.data, 'update', false)
    }
  }

  async markItemSynced(itemId: string): Promise<void> {
    const record = await this.getItem(itemId)
    if (record) {
      record.pendingSync = false
      record.pendingOperation = undefined
      await this.saveItem(record.data, 'update', false)
    }
  }

  // Clear all data (for logout)
  async clearAllData(): Promise<void> {
    const db = this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['shopping_lists', 'items', 'sync_metadata'], 'readwrite')
      
      const promises = [
        transaction.objectStore('shopping_lists').clear(),
        transaction.objectStore('items').clear(), 
        transaction.objectStore('sync_metadata').clear()
      ]

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

// Export a singleton instance
export const offlineStorage = new OfflineStorage()

// Initialize on import (but don't await to avoid blocking)
offlineStorage.init().catch(console.error)

export type { OfflineRecord, SyncMetadata } 