import { offlineStorage, type OfflineRecord } from './storage'
import { syncManager } from './sync'
import type { 
  ShoppingList, 
  Item, 
  NewShoppingList, 
  NewItem, 
  UpdateShoppingList, 
  UpdateItem,
  ShoppingListWithItems 
} from '@/lib/supabase/types'
import {
  getShoppingListsOriginal,
  getShoppingListOriginal,
  getListItemsOriginal,
  getUserAnalyticsOriginal,
  updateItemOriginal,
  toggleItemCheckedOriginal,
  createItemOriginal,
  updateShoppingListOriginal,
  deleteItemOriginal,
  deleteShoppingListOriginal
} from '@/lib/supabase/client'

interface OfflineClientResponse<T> {
  data: T | null
  error: string | null
}

interface OfflineClientMultiResponse<T> {
  data: T[] | null
  error: string | null
}

class OfflineClient {
  private initialized = false

  constructor() {
    this.init()
  }

  private async init() {
    if (this.initialized) return
    
    try {
      await offlineStorage.init()
      // Only start auto sync if we're in a browser environment
      if (typeof window !== 'undefined') {
        syncManager.startAutoSync(30000)
      }
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize offline client:', error)
    }
  }

  // Shopping Lists Operations
  async getShoppingLists(userId: string): Promise<OfflineClientMultiResponse<ShoppingListWithItems>> {
    if (syncManager.getStatus().isOnline) {
      // Try Supabase first
      const { data, error } = await getShoppingListsOriginal(userId)
      if (data) {
        // Transform data to ensure it matches ShoppingListWithItems type
        const transformedData: ShoppingListWithItems[] = data.map(list => ({
          ...list,
          category_order: (list as any).category_order || null,
          share_code: (list as any).share_code || null,
          created_by: (list as any).created_by || null,
          items: (list.items || []).map(item => ({
            ...item,
            list_id: list.id // Add missing list_id to items
          }))
        }))
        return { data: transformedData, error: null }
      }
      // If Supabase fails, fallback to IndexedDB
    }
    // Offline or Supabase failed
    try {
      const listRecords = await offlineStorage.getShoppingLists(userId)
      const listsWithItems: ShoppingListWithItems[] = []
      for (const listRecord of listRecords) {
        const itemRecords = await offlineStorage.getListItems(listRecord.id)
        const items = itemRecords.map(record => record.data)
        listsWithItems.push({ ...listRecord.data, items })
      }
      return { data: listsWithItems, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get shopping lists' }
    }
  }

  async getShoppingList(listId: string): Promise<OfflineClientResponse<ShoppingList>> {
    if (syncManager.getStatus().isOnline) {
      const { data, error } = await getShoppingListOriginal(listId)
      if (data) return { data, error: null }
    }
    try {
      const record = await offlineStorage.getShoppingList(listId)
      if (!record) return { data: null, error: 'Shopping list not found' }
      return { data: record.data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get shopping list' }
    }
  }

  async createShoppingList(listData: NewShoppingList): Promise<OfflineClientResponse<ShoppingList>> {
    try {
      const record = await offlineStorage.saveShoppingList(listData, 'create', true)
      if (!record) {
        return { data: null, error: 'Failed to create shopping list' }
      }
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: record.data,
        error: null
      }
    } catch (error) {
      console.error('Failed to create shopping list:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create shopping list'
      }
    }
  }

  async updateShoppingList(listId: string, updates: Partial<UpdateShoppingList>): Promise<OfflineClientResponse<ShoppingList>> {
    try {
      const existingRecord = await offlineStorage.getShoppingList(listId)
      
      if (!existingRecord) {
        return {
          data: null,
          error: 'Shopping list not found'
        }
      }

      const updatedList: ShoppingList = {
        ...existingRecord.data,
        ...updates,
        updated_at: new Date().toISOString()
      }

      const record = await offlineStorage.saveShoppingList(updatedList, 'update', true)
      if (!record) {
        return { data: null, error: 'Failed to update shopping list' }
      }
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: record.data,
        error: null
      }
    } catch (error) {
      console.error('Failed to update shopping list:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update shopping list'
      }
    }
  }

  async deleteShoppingList(listId: string): Promise<OfflineClientResponse<null>> {
    try {
      await offlineStorage.deleteShoppingList(listId, true)
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: null,
        error: null
      }
    } catch (error) {
      console.error('Failed to delete shopping list:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete shopping list'
      }
    }
  }

  async updateCategoryOrder(listId: string, categoryOrder: string[]): Promise<OfflineClientResponse<null>> {
    try {
      const existingRecord = await offlineStorage.getShoppingList(listId)
      
      if (!existingRecord) {
        return {
          data: null,
          error: 'Shopping list not found'
        }
      }

      const updatedList: ShoppingList = {
        ...existingRecord.data,
        category_order: categoryOrder,
        updated_at: new Date().toISOString()
      }

      await offlineStorage.saveShoppingList(updatedList, 'update', true)
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: null,
        error: null
      }
    } catch (error) {
      console.error('Failed to update category order:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update category order'
      }
    }
  }

  // Items Operations
  async getListItems(listId: string): Promise<OfflineClientMultiResponse<Item>> {
    if (syncManager.getStatus().isOnline) {
      const { data, error } = await getListItemsOriginal(listId)
      if (data) return { data, error: null }
    }
    try {
      const itemRecords = await offlineStorage.getListItems(listId)
      const items = itemRecords.map(record => record.data)
      
      // Sort by position and creation date
      items.sort((a, b) => {
        if (a.position !== b.position) {
          return a.position - b.position
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      return {
        data: items,
        error: null
      }
    } catch (error) {
      console.error('Failed to get list items:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get list items'
      }
    }
  }

  async updateItem(itemId: string, updates: Partial<UpdateItem>): Promise<OfflineClientResponse<Item>> {
    if (syncManager.getStatus().isOnline) {
      // Try Supabase first when online
      const { data, error } = await updateItemOriginal(itemId, updates)
      if (data) {
        // Also update local storage for consistency
        await offlineStorage.saveItem(data, 'update', false)
        return { data, error: null }
      }
      // If Supabase fails, fallback to IndexedDB
    }
    
    // Offline or Supabase failed - use IndexedDB
    try {
      const existingRecord = await offlineStorage.getItem(itemId)
      
      if (!existingRecord) {
        return {
          data: null,
          error: 'Item not found'
        }
      }

      const updatedItem: Item = {
        ...existingRecord.data,
        ...updates,
        updated_at: new Date().toISOString()
      }

      const record = await offlineStorage.saveItem(updatedItem, 'update', true)
      if (!record) {
        return { data: null, error: 'Failed to update item' }
      }
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: record.data,
        error: null
      }
    } catch (error) {
      console.error('Failed to update item:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update item'
      }
    }
  }

  async createItem(itemData: NewItem): Promise<OfflineClientResponse<Item>> {
    if (syncManager.getStatus().isOnline) {
      // Try Supabase first when online
      const { data, error } = await createItemOriginal(itemData)
      if (data) {
        // Also save to local storage for consistency
        await offlineStorage.saveItem(data, 'update', false)
        return { data, error: null }
      }
      // If Supabase fails, fallback to IndexedDB
    }
    
    // Offline or Supabase failed - use IndexedDB
    try {
      const record = await offlineStorage.saveItem(itemData, 'create', true)
      if (!record) {
        return { data: null, error: 'Failed to create item' }
      }
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: record.data,
        error: null
      }
    } catch (error) {
      console.error('Failed to create item:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create item'
      }
    }
  }

  async createManyItems(itemsData: NewItem[]): Promise<OfflineClientMultiResponse<Item>> {
    try {
      const createdItems: Item[] = []
      
      for (const itemData of itemsData) {
        const record = await offlineStorage.saveItem(itemData, 'create', true)
        if (record) {
          createdItems.push(record.data)
        }
      }
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: createdItems,
        error: null
      }
    } catch (error) {
      console.error('Failed to create items:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create items'
      }
    }
  }

  async deleteItem(itemId: string): Promise<OfflineClientResponse<null>> {
    if (syncManager.getStatus().isOnline) {
      // Try Supabase first when online
      const { error } = await deleteItemOriginal(itemId)
      if (!error) {
        // Also delete from local storage for consistency
        await offlineStorage.deleteItem(itemId, false)
        return { data: null, error: null }
      }
      // If Supabase fails, fallback to IndexedDB
    }
    
    // Offline or Supabase failed - use IndexedDB
    try {
      await offlineStorage.deleteItem(itemId, true)
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: null,
        error: null
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete item'
      }
    }
  }

  async toggleItemChecked(itemId: string, isChecked: boolean): Promise<OfflineClientResponse<Item>> {
    if (syncManager.getStatus().isOnline) {
      // Try Supabase first when online
      const { data, error } = await toggleItemCheckedOriginal(itemId, isChecked)
      if (data) {
        // Also update local storage for consistency
        await offlineStorage.saveItem(data, 'update', false)
        return { data, error: null }
      }
      // If Supabase fails, fallback to IndexedDB
    }
    
    // Offline or Supabase failed - use IndexedDB directly
    try {
      const existingRecord = await offlineStorage.getItem(itemId)
      
      if (!existingRecord) {
        return {
          data: null,
          error: 'Item not found'
        }
      }

      const updatedItem: Item = {
        ...existingRecord.data,
        is_checked: isChecked,
        updated_at: new Date().toISOString()
      }

      const record = await offlineStorage.saveItem(updatedItem, 'update', true)
      if (!record) {
        return { data: null, error: 'Failed to update item' }
      }
      
      // Trigger immediate sync if online (non-blocking)
      if (syncManager.getStatus().isOnline) {
        syncManager.forceSync().catch(console.error)
      }

      return {
        data: record.data,
        error: null
      }
    } catch (error) {
      console.error('Failed to toggle item checked:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to toggle item checked'
      }
    }
  }

  // Sync Operations
  getSyncStatus() {
    return syncManager.getStatus()
  }

  addSyncStatusListener(listener: (status: any) => void) {
    return syncManager.addStatusListener(listener)
  }

  async forceSync() {
    return syncManager.forceSync()
  }

  // Utility Operations
  isOnline(): boolean {
    return syncManager.getStatus().isOnline
  }

  async clearAllData(): Promise<void> {
    syncManager.stopAutoSync()
    await offlineStorage.clearAllData()
  }

  // Get pending changes count for UI indicators
  async getPendingChangesCount(): Promise<number> {
    try {
      const [pendingLists, pendingItems] = await Promise.all([
        offlineStorage.getPendingSyncLists(),
        offlineStorage.getPendingSyncItems()
      ])
      return pendingLists.length + pendingItems.length
    } catch (error) {
      console.error('Failed to get pending changes count:', error)
      // During SSR or when IndexedDB is not available, return 0
      return 0
    }
  }

  // Analytics placeholder (could be implemented to work with cached data)
  async getUserAnalytics(userId: string): Promise<OfflineClientResponse<any>> {
    if (syncManager.getStatus().isOnline) {
      const { data, error } = await getUserAnalyticsOriginal(userId)
      if (data) return { data, error: null }
    }
    try {
      // For now, return basic analytics from local data
      const listRecords = await offlineStorage.getShoppingLists(userId)
      let totalItems = 0
      let completedItems = 0
      const categories = new Set<string>()
      
      for (const listRecord of listRecords) {
        const itemRecords = await offlineStorage.getListItems(listRecord.id)
        totalItems += itemRecords.length
        
        for (const itemRecord of itemRecords) {
          if (itemRecord.data.is_checked) {
            completedItems++
          }
          categories.add(itemRecord.data.category)
        }
      }

      const analytics = {
        total_lists: listRecords.length,
        total_items: totalItems,
        completed_items: completedItems,
        items_this_month: totalItems, // Simplified for offline
        most_frequent_category: categories.size > 0 ? Array.from(categories)[0] : null,
        most_frequent_items: [] // Could be implemented later
      }

      return {
        data: analytics,
        error: null
      }
    } catch (error) {
      console.error('Failed to get analytics:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      }
    }
  }
}

// Export singleton instance
export const offlineClient = new OfflineClient()

// For backward compatibility, also export individual functions that match the current API
export async function getShoppingLists(userId: string) {
  return offlineClient.getShoppingLists(userId)
}

export async function getShoppingList(listId: string) {
  return offlineClient.getShoppingList(listId)
}

export async function updateShoppingList(listId: string, updates: Partial<UpdateShoppingList>) {
  return offlineClient.updateShoppingList(listId, updates)
}

export async function deleteShoppingList(listId: string) {
  return offlineClient.deleteShoppingList(listId)
}

export async function getListItems(listId: string) {
  return offlineClient.getListItems(listId)
}

export async function createItem(itemData: NewItem) {
  return offlineClient.createItem(itemData)
}

export async function createManyItems(itemsData: NewItem[]) {
  return offlineClient.createManyItems(itemsData)
}

export async function updateItem(itemId: string, updates: Partial<UpdateItem>) {
  return offlineClient.updateItem(itemId, updates)
}

export async function deleteItem(itemId: string) {
  return offlineClient.deleteItem(itemId)
}

export async function toggleItemChecked(itemId: string, isChecked: boolean) {
  return offlineClient.toggleItemChecked(itemId, isChecked)
}

export async function updateCategoryOrder(listId: string, categoryOrder: string[]) {
  return offlineClient.updateCategoryOrder(listId, categoryOrder)
}

export async function getUserAnalytics(userId: string) {
  return offlineClient.getUserAnalytics(userId)
}

// Re-export types for convenience
export type { 
  OfflineClientResponse, 
  OfflineClientMultiResponse 
} 