export interface UndoRedoAction {
  id: string
  type: 'ADD_ITEM' | 'DELETE_ITEM' | 'UPDATE_ITEM' | 'TOGGLE_ITEM' | 'DELETE_LIST' | 'UPDATE_LIST'
  timestamp: number
  description: string
  data: {
    listId: string
    itemId?: string
    item?: any
    previousState?: any
    newState?: any
  }
}

export interface UndoRedoState {
  past: UndoRedoAction[]
  present: UndoRedoAction | null
  future: UndoRedoAction[]
  maxHistorySize: number
}

export interface UndoRedoContextType {
  state: UndoRedoState
  canUndo: boolean
  canRedo: boolean
  addAction: (action: Omit<UndoRedoAction, 'id' | 'timestamp'>) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
}