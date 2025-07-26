'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Plus, Brain, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { getAISuggestions, addSuggestedItemToList, type SuggestedItem } from '../lib/ai/suggestions'
import { useToast } from '../lib/toast/context'
import { supabase } from '../lib/supabase/client'

interface AISuggestionsProps {
  userId: string
  apiKey: string
  onItemAdded?: () => void
}

export default function AISuggestions({ userId, apiKey, onItemAdded }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedList, setSelectedList] = useState<string>('')
  const [lists, setLists] = useState<any[]>([])
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set())
  const toast = useToast()

  useEffect(() => {
    if (userId && apiKey) {
      loadSuggestions()
      loadLists()
    }
  }, [userId, apiKey])

  const loadSuggestions = async () => {
    if (!userId || !apiKey) return

    setLoading(true)
    try {
      const response = await getAISuggestions(userId, apiKey, 8)
      if (response.success) {
        setSuggestions(response.items)
      } else {
        toast.error('Failed to load suggestions', response.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
      toast.error('Failed to load suggestions', 'Please try again later')
    } finally {
      setLoading(false)
    }
  }

  const loadLists = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('id, name')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLists(data || [])
      if (data && data.length > 0) {
        setSelectedList(data[0].id)
      }
    } catch (error) {
      console.error('Error loading lists:', error)
    }
  }

  const handleAddItem = async (item: SuggestedItem) => {
    if (!selectedList) {
      toast.error('No list selected', 'Please select a list first')
      return
    }

    setAddingItems(prev => new Set(prev).add(item.name))
    
    try {
      const result = await addSuggestedItemToList(selectedList, item)
      if (result.success) {
        toast.success('Item added!', `${item.name} added to your list`)
        onItemAdded?.()
        
        // Remove the item from suggestions after adding
        setSuggestions(prev => prev.filter(s => s.name !== item.name))
      } else {
        toast.error('Failed to add item', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error adding item:', error)
                             toast.error('Failed to add item', 'Please try again')
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.name)
        return newSet
      })
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />
    if (confidence >= 0.6) return <TrendingUp className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }

  if (!apiKey) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">AI Suggestions</h3>
            <p className="text-sm text-glass-muted">Smart recommendations based on your shopping patterns</p>
          </div>
        </div>
        
        <div className="glass p-4 rounded-lg opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-glass">API Key Required</h4>
              <p className="text-sm text-glass-muted">
                Add your Gemini API key in settings to enable AI suggestions
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-glass-muted"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">AI Suggestions</h3>
            <p className="text-sm text-glass-muted">Smart recommendations based on your shopping patterns</p>
          </div>
        </div>
        
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="glass-button px-3 py-2 text-sm bg-purple-500/10 border-purple-200/30 hover:bg-purple-500/20"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* List Selection */}
      {lists.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-glass-muted mb-2">
            Add to list:
          </label>
          <select
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
            className="w-full glass border-0 rounded-lg px-4 py-2 text-glass bg-glass-white-light/50"
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Suggestions */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass p-4 rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-glass-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-glass-muted rounded w-1/2"></div>
                </div>
                <div className="w-8 h-8 bg-glass-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="glass p-4 rounded-lg border border-glass-white-border/50 hover:border-purple-200/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-glass">{item.name}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-glass-white-light/50 text-glass-muted">
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-glass-muted">
                    <div className="flex items-center gap-1">
                      {getConfidenceIcon(item.confidence)}
                      <span className={getConfidenceColor(item.confidence)}>
                        {Math.round(item.confidence * 100)}% confidence
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Bought {item.frequency} times</span>
                    </div>
                    
                    {item.lastPurchased && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(item.lastPurchased).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-glass-muted mt-1 italic">
                    "{item.reason}"
                  </p>
                </div>
                
                <button
                  onClick={() => handleAddItem(item)}
                  disabled={addingItems.has(item.name) || !selectedList}
                  className="glass-button p-2 bg-green-500/10 border-green-200/30 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add to list"
                >
                  {addingItems.has(item.name) ? (
                    <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <Plus className="w-4 h-4 text-green-500" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-6 rounded-lg text-center">
          <Brain className="w-12 h-12 text-glass-muted mx-auto mb-3" />
          <h4 className="font-medium text-glass mb-2">No suggestions yet</h4>
          <p className="text-sm text-glass-muted">
            Start adding items to your shopping lists to get personalized AI suggestions
          </p>
        </div>
      )}

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-glass-white-border/30">
          <p className="text-xs text-glass-muted text-center">
            Suggestions are based on your shopping history and patterns
          </p>
        </div>
      )}
    </div>
  )
}