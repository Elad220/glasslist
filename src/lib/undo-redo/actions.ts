import { 
  createItem, 
  deleteItem, 
  updateItem, 
  toggleItemChecked,
  deleteShoppingList,
  updateShoppingList
} from '@/lib/supabase/client'
import { UndoRedoAction } from './types'

export async function executeUndoAction(action: UndoRedoAction) {
  try {
    switch (action.type) {
      case 'ADD_ITEM':
        // Undo adding an item = delete the item
        if (action.data.itemId) {
          await deleteItem(action.data.itemId)
        }
        break
        
      case 'DELETE_ITEM':
        // Undo deleting an item = recreate the item
        if (action.data.item) {
          await createItem({
            ...action.data.item,
            list_id: action.data.listId
          })
        }
        break
        
      case 'UPDATE_ITEM':
        // Undo updating an item = restore previous state
        if (action.data.itemId && action.data.previousState) {
          await updateItem(action.data.itemId, action.data.previousState)
        }
        break
        
      case 'TOGGLE_ITEM':
        // Undo toggle = toggle back
        if (action.data.itemId && action.data.previousState !== undefined) {
          await toggleItemChecked(action.data.itemId, action.data.previousState)
        }
        break
        
      case 'DELETE_LIST':
        // Undo deleting a list = restore the list
        if (action.data.previousState) {
          // Note: This would require a more complex implementation
          // as we'd need to restore the list and all its items
          console.warn('Undoing list deletion not yet implemented')
        }
        break
        
      case 'UPDATE_LIST':
        // Undo updating a list = restore previous state
        if (action.data.listId && action.data.previousState) {
          await updateShoppingList(action.data.listId, action.data.previousState)
        }
        break
        
      default:
        console.warn('Unknown action type:', action.type)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error executing undo action:', error)
    return { success: false, error }
  }
}

export async function executeRedoAction(action: UndoRedoAction) {
  try {
    switch (action.type) {
      case 'ADD_ITEM':
        // Redo adding an item = recreate the item
        if (action.data.item) {
          await createItem({
            ...action.data.item,
            list_id: action.data.listId
          })
        }
        break
        
      case 'DELETE_ITEM':
        // Redo deleting an item = delete the item again
        if (action.data.itemId) {
          await deleteItem(action.data.itemId)
        }
        break
        
      case 'UPDATE_ITEM':
        // Redo updating an item = apply new state
        if (action.data.itemId && action.data.newState) {
          await updateItem(action.data.itemId, action.data.newState)
        }
        break
        
      case 'TOGGLE_ITEM':
        // Redo toggle = toggle to new state
        if (action.data.itemId && action.data.newState !== undefined) {
          await toggleItemChecked(action.data.itemId, action.data.newState)
        }
        break
        
      case 'DELETE_LIST':
        // Redo deleting a list = delete the list again
        if (action.data.listId) {
          await deleteShoppingList(action.data.listId)
        }
        break
        
      case 'UPDATE_LIST':
        // Redo updating a list = apply new state
        if (action.data.listId && action.data.newState) {
          await updateShoppingList(action.data.listId, action.data.newState)
        }
        break
        
      default:
        console.warn('Unknown action type:', action.type)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error executing redo action:', error)
    return { success: false, error }
  }
}