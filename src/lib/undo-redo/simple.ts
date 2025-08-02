// Simple undo/redo system for toast-based interactions

// Helper to generate a UUID (v4) - safe for all environments
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

export interface UndoAction {
  id: string
  type: 'DELETE_ITEM' | 'DELETE_LIST'
  description: string
  execute: () => Promise<void>
  timestamp: number
}

export interface UndoActionData {
  type: 'DELETE_ITEM' | 'DELETE_LIST'
  description: string
  execute: () => Promise<void>
}

class UndoManager {
  private actions: UndoAction[] = []
  private maxActions = 10

  addAction(action: UndoActionData) {
    const newAction: UndoAction = {
      ...action,
      id: generateUUID(),
      timestamp: Date.now()
    }

    this.actions.unshift(newAction)
    
    // Keep only the latest actions
    if (this.actions.length > this.maxActions) {
      this.actions = this.actions.slice(0, this.maxActions)
    }

    return newAction
  }

  getLatestAction(): UndoAction | null {
    return this.actions[0] || null
  }

  removeAction(actionId: string) {
    this.actions = this.actions.filter(action => action.id !== actionId)
  }

  clearActions() {
    this.actions = []
  }

  getActionCount(): number {
    return this.actions.length
  }
}

// Global instance
export const undoManager = new UndoManager()

// Helper functions for common undo actions
export function createDeleteItemUndoAction(
  listId: string, 
  item: any, 
  itemId: string,
  onSuccess?: () => void
): UndoActionData {
  return {
    type: 'DELETE_ITEM',
    description: `Deleted "${item.name}"`,
    execute: async () => {
      try {
        const { createItem } = await import('@/lib/supabase/client')
        
        const itemData = {
          list_id: listId,
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          notes: item.notes,
          image_url: item.image_url,
          is_checked: item.is_checked
        }
        
        await createItem(itemData)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to undo item deletion:', error)
        throw error
      }
    }
  }
}

export function createDeleteListUndoAction(
  list: any,
  onSuccess?: () => void
): UndoActionData {
  // Note: This is a simplified version - in a real implementation,
  // you'd need to restore the list and all its items
  return {
    type: 'DELETE_LIST',
    description: `Deleted list "${list.name}"`,
    execute: async () => {
      try {
        // For now, just show a message that this isn't fully implemented
        console.warn('List restoration not fully implemented')
        onSuccess?.()
      } catch (error) {
        console.error('Failed to undo list deletion:', error)
        throw error
      }
    }
  }
}