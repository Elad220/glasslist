import { useCallback } from 'react'
import { useUndoRedo } from './context'
import { executeUndoAction, executeRedoAction } from './actions'
import { useToast } from '@/lib/toast/context'

export function useUndoRedoWithExecution() {
  const { addAction, undo, redo, canUndo, canRedo, state } = useUndoRedo()
  const toast = useToast()

  const executeUndo = useCallback(async () => {
    try {
      if (!state.present) return
      
      const result = await executeUndoAction(state.present)
      if (result.success) {
        undo()
        toast.success('Action undone successfully')
      } else {
        toast.error('Failed to undo action')
      }
    } catch (error) {
      console.error('Error during undo execution:', error)
      toast.error('Failed to undo action')
    }
  }, [undo, toast, state.present])

  const executeRedo = useCallback(async () => {
    try {
      if (state.future.length === 0) return
      
      const nextAction = state.future[0]
      const result = await executeRedoAction(nextAction)
      if (result.success) {
        redo()
        toast.success('Action redone successfully')
      } else {
        toast.error('Failed to redo action')
      }
    } catch (error) {
      console.error('Error during redo execution:', error)
      toast.error('Failed to redo action')
    }
  }, [redo, toast, state.future])

  return {
    addAction,
    executeUndo,
    executeRedo,
    canUndo,
    canRedo
  }
}

// Hook for adding item actions
export function useItemActions() {
  const { addAction } = useUndoRedo()

  const addItemAction = useCallback((listId: string, item: any, itemId?: string) => {
    addAction({
      type: 'ADD_ITEM',
      description: `Added "${item.name}" to list`,
      data: {
        listId,
        itemId,
        item
      }
    })
  }, [addAction])

  const deleteItemAction = useCallback((listId: string, item: any, itemId: string) => {
    addAction({
      type: 'DELETE_ITEM',
      description: `Deleted "${item.name}" from list`,
      data: {
        listId,
        itemId,
        item
      }
    })
  }, [addAction])

  const updateItemAction = useCallback((
    listId: string, 
    itemId: string, 
    previousState: any, 
    newState: any,
    itemName: string
  ) => {
    addAction({
      type: 'UPDATE_ITEM',
      description: `Updated "${itemName}"`,
      data: {
        listId,
        itemId,
        previousState,
        newState
      }
    })
  }, [addAction])

  const toggleItemAction = useCallback((
    listId: string, 
    itemId: string, 
    previousState: boolean, 
    newState: boolean,
    itemName: string
  ) => {
    addAction({
      type: 'TOGGLE_ITEM',
      description: `${newState ? 'Checked' : 'Unchecked'} "${itemName}"`,
      data: {
        listId,
        itemId,
        previousState,
        newState
      }
    })
  }, [addAction])

  return {
    addItemAction,
    deleteItemAction,
    updateItemAction,
    toggleItemAction
  }
}

// Hook for adding list actions
export function useListActions() {
  const { addAction } = useUndoRedo()

  const deleteListAction = useCallback((listId: string, list: any) => {
    addAction({
      type: 'DELETE_LIST',
      description: `Deleted list "${list.name}"`,
      data: {
        listId,
        previousState: list
      }
    })
  }, [addAction])

  const updateListAction = useCallback((
    listId: string, 
    previousState: any, 
    newState: any,
    listName: string
  ) => {
    addAction({
      type: 'UPDATE_LIST',
      description: `Updated list "${listName}"`,
      data: {
        listId,
        previousState,
        newState
      }
    })
  }, [addAction])

  return {
    deleteListAction,
    updateListAction
  }
}