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
import { smartShoppingTipsCooldown } from '../lib/ai/cooldown'
import { isAIFeatureEnabled } from '../lib/ai/preferences'
import type { Profile } from '../lib/supabase/types'

interface ShoppingTip {
  id: string
  title: string
  description: string
  category: 'efficiency' | 'savings' | 'organization' | 'health' | 'seasonal'
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  iconName: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface SmartShoppingTipsProps {
  userId: string
  apiKey: string
  profile: Profile | null
  analytics: any
  shoppingLists: any[]
}

export default function SmartShoppingTips({ 
  userId, 
  apiKey, 
  profile,
  analytics, 
  shoppingLists 
}: SmartShoppingTipsProps) {
  const [tips, setTips] = useState<ShoppingTip[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [cooldownText, setCooldownText] = useState<string>('')
  const [canRefresh, setCanRefresh] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (userId && analytics && Array.isArray(shoppingLists) && shoppingLists.length > 0) {
      // Check for cached data first
      const cachedData = smartShoppingTipsCooldown.getCachedData()
      if (cachedData && cachedData.tips) {
        setTips(cachedData.tips)
        setLastUpdated(smartShoppingTipsCooldown.getLastUpdateTime())
      } else if (!smartShoppingTipsCooldown.isInCooldown()) {
        // Only generate if not in cooldown
        generateTips()
      }
    }
  }, [userId, analytics, shoppingLists])

  // Update cooldown status periodically
  useEffect(() => {
    const updateCooldownStatus = () => {
      setCanRefresh(!smartShoppingTipsCooldown.isInCooldown())
      setCooldownText(smartShoppingTipsCooldown.getLastUpdateText())
    }
    
    updateCooldownStatus()
    const interval = setInterval(updateCooldownStatus, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [lastUpdated])

  const handleManualRefresh = async () => {
    if (loading) return
    
    // Force refresh by clearing cooldown
    smartShoppingTipsCooldown.forceRefresh()
    await generateTips()
  }

  const handleForceRefresh = async () => {
    if (loading) return
    
    // Force refresh even during cooldown
    smartShoppingTipsCooldown.forceRefresh()
    await generateTips()
  }

  const generateTips = async () => {
    if (!userId) return

    setLoading(true)
    try {
      // Check if we're in demo mode (no API key or no Supabase)
      const isDemoMode = !apiKey || !supabase
      
      if (isDemoMode) {
        // Generate demo tips
        const demoTips = generateDemoTips(analytics, shoppingLists)
        setTips(demoTips)
        setLastUpdated(new Date())
        // Update cooldown with cached data
        smartShoppingTipsCooldown.updateCooldown({ tips: demoTips })
        return
      }

      // Get shopping history for analysis
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
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
      // Update cooldown with cached data
      smartShoppingTipsCooldown.updateCooldown({ tips: aiTips })
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
             const completionRates = new Map<string, { total: number, completed: number }>()

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
        actionable: tip.actionable || false,
        iconName: getTipStyling(tip.category).iconName
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
          iconName: 'clock',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10'
        }
      case 'savings':
        return {
          iconName: 'dollar-sign',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10'
        }
      case 'organization':
        return {
          iconName: 'package',
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10'
        }
      case 'health':
        return {
          iconName: 'target',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10'
        }
      case 'seasonal':
        return {
          iconName: 'calendar',
          color: 'text-pink-500',
          bgColor: 'bg-pink-500/10'
        }
      default:
        return {
          iconName: 'lightbulb',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10'
        }
    }
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return <Clock className="w-4 h-4" />
      case 'dollar-sign':
        return <DollarSign className="w-4 h-4" />
      case 'package':
        return <Package className="w-4 h-4" />
      case 'target':
        return <Target className="w-4 h-4" />
      case 'calendar':
        return <Calendar className="w-4 h-4" />
      case 'lightbulb':
        return <Lightbulb className="w-4 h-4" />
      default:
        return <Lightbulb className="w-4 h-4" />
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

  const generateDemoTips = (analytics: any, shoppingLists: any[]): ShoppingTip[] => {
    const tips: ShoppingTip[] = []

    // Demo efficiency tip
    tips.push({
      id: 'demo-efficiency-1',
      title: 'Optimize Your Shopping Route',
      description: 'Based on your shopping patterns, try organizing your list by store sections to minimize backtracking and save time.',
      category: 'efficiency',
      priority: 'high',
      actionable: true,
      iconName: 'clock'
    })

    // Demo savings tip
    tips.push({
      id: 'demo-savings-1',
      title: 'Bulk Buy Your Top Items',
      description: `You frequently buy ${analytics?.most_frequent_items?.[0]?.name || 'milk'}. Consider buying in bulk when on sale to save money over time.`,
      category: 'savings',
      priority: 'medium',
      actionable: true,
      iconName: 'dollar-sign'
    })

    // Demo organization tip
    tips.push({
      id: 'demo-organization-1',
      title: 'Create Weekly Meal Plans',
      description: 'Plan your meals for the week before shopping. This helps you buy only what you need and reduces food waste.',
      category: 'organization',
      priority: 'high',
      actionable: true,
      iconName: 'package'
    })

    // Demo health tip
    tips.push({
      id: 'demo-health-1',
      title: 'Add More Fresh Produce',
      description: 'Consider adding more fresh fruits and vegetables to your shopping routine for better nutrition and variety.',
      category: 'health',
      priority: 'medium',
      actionable: true,
      iconName: 'target'
    })

    return tips
  }

  const generateFallbackTips = (analytics: any, shoppingLists: any[]): ShoppingTip[] => {
    const tips: ShoppingTip[] = []

    // Efficiency tip
    if (analytics?.total_items > 0) {
      tips.push({
        id: 'tip-efficiency-1',
        title: 'Plan Your Shopping',
        description: 'Create a weekly meal plan and shopping list to reduce impulse purchases and save time.',
        category: 'efficiency',
        priority: 'high',
        actionable: true,
        iconName: 'clock'
      })
    }

    // Organization tip
    if (Array.isArray(shoppingLists) && shoppingLists.length > 0) {
      tips.push({
        id: 'tip-organization-1',
        title: 'Organize Your Lists',
        description: 'Group items by category in your shopping lists to make your trips more efficient.',
        category: 'organization',
        priority: 'medium',
        actionable: true,
        iconName: 'package'
      })
    }

    // Savings tip
    tips.push({
      id: 'tip-savings-1',
      title: 'Buy in Bulk',
      description: 'Consider buying non-perishable items in bulk to save money in the long run.',
      category: 'savings',
      priority: 'medium',
      actionable: true,
      iconName: 'dollar-sign'
    })

    // Health tip
    tips.push({
      id: 'tip-health-1',
      title: 'Shop the Perimeter',
      description: 'Focus on fresh produce, dairy, and proteins around the store perimeter for healthier choices.',
      category: 'health',
      priority: 'low',
      actionable: true,
      iconName: 'target'
    })

    return tips
  }



  if (!apiKey || !isAIFeatureEnabled(profile, 'ai_tips_enabled')) {
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
              <h4 className="font-medium text-glass">
                {!apiKey ? 'API Key Required' : 'Feature Disabled'}
              </h4>
              <p className="text-sm text-glass-muted">
                {!apiKey 
                  ? 'Add your Gemini API key in settings to enable AI tips'
                  : 'Enable AI Shopping Tips in your settings to see recommendations'
                }
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
          onClick={canRefresh ? handleManualRefresh : handleForceRefresh}
          disabled={loading}
          className={`glass-button px-3 py-2 text-sm ${
            canRefresh 
              ? 'bg-yellow-500/10 border-yellow-200/30 hover:bg-yellow-500/20' 
              : 'bg-amber-500/10 border-amber-200/30 hover:bg-amber-500/20'
          }`}
          title={canRefresh ? "Refresh tips" : `Force refresh (${smartShoppingTipsCooldown.getTimeRemainingText()})`}
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
          ) : (
            <RefreshCw className={`w-4 h-4 ${!canRefresh ? 'text-amber-500' : ''}`} />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-glass-muted mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Last updated: {cooldownText}</span>
        </div>
        {!canRefresh && (
          <span className="text-amber-600">
            {smartShoppingTipsCooldown.getTimeRemainingText()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={`loading-tip-${i}`} className="glass p-4 rounded-lg animate-pulse">
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
                key={`tip-${tip.id}`}
                className="glass p-4 rounded-lg border border-glass-white-border/50 hover:border-yellow-200/30 transition-all duration-200"
              >
                              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${styling.bgColor} flex items-center justify-center flex-shrink-0`}>
                  {renderIcon(tip.iconName)}
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