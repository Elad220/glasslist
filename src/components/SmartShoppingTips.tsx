'use client'

import { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  Clock, 
  Calendar, 
  ShoppingCart, 
  Target, 
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase/client'
import { useToast } from '../lib/toast/context'

interface ShoppingTip {
  id: string
  title: string
  description: string
  category: 'efficiency' | 'savings' | 'organization' | 'health' | 'seasonal'
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface SmartShoppingTipsProps {
  userId: string
  apiKey: string
  analytics: any
  shoppingLists: any[]
}

export default function SmartShoppingTips({ 
  userId, 
  apiKey, 
  analytics, 
  shoppingLists 
}: SmartShoppingTipsProps) {
  const [tips, setTips] = useState<ShoppingTip[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (userId && apiKey && analytics && shoppingLists.length > 0) {
      generateTips()
    }
  }, [userId, apiKey, analytics, shoppingLists])

  const generateTips = async () => {
    if (!userId || !apiKey) return

    setLoading(true)
    try {
      // Get shopping history for analysis
      const { data: historyData, error: historyError } = await supabase
        .from('items')
        .select(`
          name,
          category,
          amount,
          unit,
          created_at,
          is_checked,
          shopping_lists!inner(id, user_id, name, created_at)
        `)
        .eq('shopping_lists.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(300)

      if (historyError) {
        throw new Error(`Failed to fetch shopping history: ${historyError.message}`)
      }

      if (!historyData || historyData.length === 0) {
        setTips([])
        return
      }

      // Generate AI tips
      const aiTips = await generateAITips(historyData, analytics, shoppingLists, apiKey)
      setTips(aiTips)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error generating tips:', error)
      toast.error('Failed to generate tips', 'Please try again later')
      // Fallback to basic tips
      setTips(generateFallbackTips(analytics, shoppingLists))
    } finally {
      setLoading(false)
    }
  }

  const generateAITips = async (
    historyData: any[], 
    analytics: any, 
    shoppingLists: any[], 
    apiKey: string
  ): Promise<ShoppingTip[]> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Analyze shopping patterns
      const itemFrequency = new Map<string, number>()
      const categorySpending = new Map<string, number>()
      const shoppingDays = new Set<string>()
      const completionRates = new Map<string, number>()

      historyData.forEach(item => {
        const itemKey = item.name.toLowerCase().trim()
        const categoryKey = item.category
        const shoppingDate = new Date(item.created_at).toDateString()
        
        itemFrequency.set(itemKey, (itemFrequency.get(itemKey) || 0) + 1)
        categorySpending.set(categoryKey, (categorySpending.get(categoryKey) || 0) + 1)
        shoppingDays.add(shoppingDate)
        
        if (item.shopping_lists) {
          const listKey = item.shopping_lists.name
          const current = completionRates.get(listKey) || { total: 0, completed: 0 }
          current.total++
          if (item.is_checked) current.completed++
          completionRates.set(listKey, current)
        }
      })

      // Calculate metrics
      const totalShoppingDays = shoppingDays.size
      const avgItemsPerTrip = historyData.length / totalShoppingDays
      const avgCompletionRate = Array.from(completionRates.values()).reduce((acc, rates) => 
        acc + (rates.completed / rates.total), 0) / completionRates.size

      const topCategories = Array.from(categorySpending.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      const currentMonth = new Date().getMonth()
      const currentSeason = getCurrentSeason(currentMonth)

      const prompt = `
You are a smart shopping advisor. Analyze the user's shopping data and provide 4-6 personalized shopping tips.

Shopping Data:
- Total items purchased: ${analytics.total_items}
- Completed items: ${analytics.completed_items}
- Total lists: ${analytics.total_lists}
- Items this month: ${analytics.items_this_month}
- Average items per shopping trip: ${avgItemsPerTrip.toFixed(1)}
- Average completion rate: ${(avgCompletionRate * 100).toFixed(1)}%
- Total shopping days: ${totalShoppingDays}

Top categories by frequency:
${topCategories.map(([cat, count]) => `- ${cat}: ${count} items`).join('\n')}

Current season: ${currentSeason}

Generate 4-6 personalized shopping tips. Consider:
1. Efficiency improvements (batching, planning, timing)
2. Cost savings opportunities
3. Organization and list management
4. Health and nutrition optimization
5. Seasonal shopping strategies
6. Completion rate improvements

Return ONLY a valid JSON array with objects containing these exact fields:
- title: string (short, catchy tip title)
- description: string (detailed explanation with actionable advice)
- category: string (one of: "efficiency", "savings", "organization", "health", "seasonal")
- priority: string (one of: "high", "medium", "low")
- actionable: boolean (whether this tip has a specific action)

Example output:
[
  {
    "title": "Batch Your Shopping",
    "description": "You shop ${avgItemsPerTrip.toFixed(1)} items per trip on average. Consider batching your shopping to reduce trips and save time. Plan for 2-3 weeks at once.",
    "category": "efficiency",
    "priority": "high",
    "actionable": true
  }
]
`

      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Clean the response to extract just the JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI')
      }

      const parsedTips: any[] = JSON.parse(jsonMatch[0])

      // Transform to ShoppingTip objects with IDs
      return parsedTips.map((tip, index) => ({
        id: `tip-${Date.now()}-${index}`,
        title: tip.title,
        description: tip.description,
        category: tip.category,
        priority: tip.priority,
        actionable: tip.actionable || false
      }))

    } catch (error) {
      console.error('Error generating AI tips:', error)
      throw error
    }
  }

  const getCurrentSeason = (month: number): string => {
    if (month >= 2 && month <= 4) return 'Spring'
    if (month >= 5 && month <= 7) return 'Summer'
    if (month >= 8 && month <= 10) return 'Fall'
    return 'Winter'
  }

  const getTipStyling = (category: string) => {
    switch (category) {
      case 'efficiency':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10'
        }
      case 'savings':
        return {
          icon: <DollarSign className="w-4 h-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10'
        }
      case 'organization':
        return {
          icon: <Package className="w-4 h-4" />,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10'
        }
      case 'health':
        return {
          icon: <Target className="w-4 h-4" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10'
        }
      case 'seasonal':
        return {
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-pink-500',
          bgColor: 'bg-pink-500/10'
        }
      default:
        return {
          icon: <Lightbulb className="w-4 h-4" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10'
        }
    }
  }

  const getPriorityStyling = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'low':
        return 'text-green-500 bg-green-500/10'
      default:
        return 'text-gray-500 bg-gray-500/10'
    }
  }

  const generateFallbackTips = (analytics: any, shoppingLists: any[]): ShoppingTip[] => {
    const tips: ShoppingTip[] = []

    // Efficiency tip
    if (analytics.total_items > 0) {
      tips.push({
        id: 'tip-efficiency-1',
        title: 'Plan Your Shopping',
        description: 'Create a weekly meal plan and shopping list to reduce impulse purchases and save time.',
        category: 'efficiency',
        priority: 'high',
        actionable: true
      })
    }

    // Organization tip
    if (shoppingLists.length > 0) {
      tips.push({
        id: 'tip-organization-1',
        title: 'Organize Your Lists',
        description: 'Group items by category in your shopping lists to make your trips more efficient.',
        category: 'organization',
        priority: 'medium',
        actionable: true
      })
    }

    // Savings tip
    tips.push({
      id: 'tip-savings-1',
      title: 'Buy in Bulk',
      description: 'Consider buying non-perishable items in bulk to save money in the long run.',
      category: 'savings',
      priority: 'medium',
      actionable: true
    })

    // Health tip
    tips.push({
      id: 'tip-health-1',
      title: 'Shop the Perimeter',
      description: 'Focus on fresh produce, dairy, and proteins around the store perimeter for healthier choices.',
      category: 'health',
      priority: 'low',
      actionable: true
    })

    return tips
  }

  if (!apiKey) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">Smart Shopping Tips</h3>
            <p className="text-sm text-glass-muted">AI-powered shopping advice</p>
          </div>
        </div>
        
        <div className="glass p-4 rounded-lg opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-glass">API Key Required</h4>
              <p className="text-sm text-glass-muted">
                Add your Gemini API key in settings to enable smart tips
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">Smart Shopping Tips</h3>
            <p className="text-sm text-glass-muted">AI-powered shopping advice</p>
          </div>
        </div>
        
        <button
          onClick={generateTips}
          disabled={loading}
          className="glass-button px-3 py-2 text-sm bg-yellow-500/10 border-yellow-200/30 hover:bg-yellow-500/20"
          title="Refresh tips"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {lastUpdated && (
        <div className="text-xs text-glass-muted mb-4 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass p-4 rounded-lg animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-glass-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-glass-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-glass-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-glass-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tips.length > 0 ? (
        <div className="space-y-4">
          {tips.map((tip) => {
            const styling = getTipStyling(tip.category)
            const priorityStyling = getPriorityStyling(tip.priority)
            
            return (
              <div
                key={tip.id}
                className="glass p-4 rounded-lg border border-glass-white-border/50 hover:border-yellow-200/30 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${styling.bgColor} flex items-center justify-center flex-shrink-0`}>
                    {styling.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-glass-heading">{tip.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${priorityStyling}`}>
                        {tip.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-glass-muted leading-relaxed">
                      {tip.description}
                    </p>
                    
                    {tip.actionable && (
                      <button
                        onClick={() => {
                          toast.success('Tip applied', 'Shopping tip has been applied to your strategy')
                        }}
                        className="mt-2 text-xs glass-button px-3 py-1 bg-yellow-500/10 border-yellow-200/30 hover:bg-yellow-500/20"
                      >
                        Apply Tip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass p-6 rounded-lg text-center">
          <Lightbulb className="w-12 h-12 text-glass-muted mx-auto mb-3" />
          <h4 className="font-medium text-glass mb-2">No tips yet</h4>
          <p className="text-sm text-glass-muted">
            Start shopping to get personalized AI-powered tips
          </p>
        </div>
      )}

      {/* Footer */}
      {tips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-glass-white-border/30">
          <p className="text-xs text-glass-muted text-center">
            Tips are personalized based on your shopping patterns
          </p>
        </div>
      )}
    </div>
  )
}