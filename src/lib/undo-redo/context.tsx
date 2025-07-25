'use client'

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { UndoRedoState, UndoRedoAction, UndoRedoContextType } from './types'

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined)

// Action types for the reducer
type UndoRedoReducerAction = 
  | { type: 'ADD_ACTION'; payload: UndoRedoAction }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }

// Initial state
const initialState: UndoRedoState = {
  past: [],
  present: null,
  future: [],
  maxHistorySize: 50
}

// Reducer function
function undoRedoReducer(state: UndoRedoState, action: UndoRedoReducerAction): UndoRedoState {
  switch (action.type) {
    case 'ADD_ACTION': {
      const { past, present, future, maxHistorySize } = state
      
      // When adding a new action, clear the future
      const newPast = present 
        ? [...past, present].slice(-maxHistorySize)
        : past
      
      return {
        ...state,
        past: newPast,
        present: action.payload,
        future: []
      }
    }
    
    case 'UNDO': {
      const { past, present, future } = state
      
      if (!present || past.length === 0) {
        return state
      }
      
      const previous = past[past.length - 1]
      const newPast = past.slice(0, past.length - 1)
      
      return {
        ...state,
        past: newPast,
        present: previous,
        future: [present, ...future]
      }
    }
    
    case 'REDO': {
      const { past, present, future } = state
      
      if (future.length === 0) {
        return state
      }
      
      const next = future[0]
      const newFuture = future.slice(1)
      
      return {
        ...state,
        past: present ? [...past, present] : past,
        present: next,
        future: newFuture
      }
    }
    
    case 'CLEAR_HISTORY': {
      return {
        ...state,
        past: [],
        present: null,
        future: []
      }
    }
    
    default:
      return state
  }
}

// Provider component
export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(undoRedoReducer, initialState)

  const addAction = useCallback((action: Omit<UndoRedoAction, 'id' | 'timestamp'>) => {
    const newAction: UndoRedoAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    
    dispatch({ type: 'ADD_ACTION', payload: newAction })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [])

  const value: UndoRedoContextType = {
    state,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    addAction,
    undo,
    redo,
    clearHistory
  }

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  )
}

// Hook to use the context
export function useUndoRedo() {
  const context = useContext(UndoRedoContext)
  if (context === undefined) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider')
  }
  return context
}