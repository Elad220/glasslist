'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  ShoppingCart, 
  Sparkles, 
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Zap
} from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase/client'
import { useToast } from '../lib/toast/context'

interface Insight {
  type: 'trend' | 'recommendation' | 'pattern' | 'alert' | 'achievement'
  title: string
  description: string
  icon: React.ReactNode
  color: string
  confidence?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface GenAIInsightsProps {
  userId: string
  apiKey: string
  analytics: any
  shoppingLists: any[]
  onRefresh?: () => void
}

export default function GenAIInsights({ 
  userId, 
  apiKey, 
  analytics, 
  shoppingLists, 
  onRefresh 
}: GenAIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (userId && analytics && shoppingLists.length > 0) {
      generateInsights()
    }
  }, [userId, analytics, shoppingLists])

  const generateInsights = async () => {
    if (!userId) return

    setLoading(true)
    try {
      // Check if we're in demo mode (no API key or no Supabase)
      const isDemoMode = !apiKey || !supabase
      
      if (isDemoMode) {
        // Generate demo insights
        const demoInsights = generateDemoInsights(analytics, shoppingLists)
        setInsights(demoInsights)
        setLastUpdated(new Date())
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
          shopping_lists!inner(id, user_id, name)
        `)
        .eq('shopping_lists.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (historyError) {
        throw new Error(`Failed to fetch shopping history: ${historyError.message}`)
      }

      if (!historyData || historyData.length === 0) {
        setInsights([])
        return
      }

      // Generate AI insights
      const aiInsights = await generateAIInsights(historyData, analytics, shoppingLists, apiKey)
      setInsights(aiInsights)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error generating insights:', error)
      toast.error('Failed to generate insights', 'Please try again later')
      // Fallback to basic insights
      setInsights(generateFallbackInsights(analytics, shoppingLists))
    } finally {
      setLoading(false)
    }
  }

  const generateAIInsights = async (
    historyData: any[], 
    analytics: any, 
    shoppingLists: any[], 
    apiKey: string
  ): Promise<Insight[]> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Analyze shopping patterns
                   const itemFrequency = new Map<string, number>()
             const categoryFrequency = new Map<string, number>()
             const monthlyTrends = new Map<string, number>()
             const completionRates = new Map<string, { total: number, completed: number }>()

      historyData.forEach(item => {
        const itemKey = item.name.toLowerCase().trim()
        const categoryKey = item.category
        const monthKey = new Date(item.created_at).toISOString().slice(0, 7)
        
        itemFrequency.set(itemKey, (itemFrequency.get(itemKey) || 0) + 1)
        categoryFrequency.set(categoryKey, (categoryFrequency.get(categoryKey) || 0) + 1)
        monthlyTrends.set(monthKey, (monthlyTrends.get(monthKey) || 0) + 1)
        
        if (item.shopping_lists) {
          const listKey = item.shopping_lists.name
          const current = completionRates.get(listKey) || { total: 0, completed: 0 }
          current.total++
          if (item.is_checked) current.completed++
          completionRates.set(listKey, current)
        }
      })

      // Calculate trends
      const recentMonths = Array.from(monthlyTrends.keys()).sort().slice(-3)
      const recentTrend = recentMonths.length >= 2 ? 
        (monthlyTrends.get(recentMonths[recentMonths.length - 1]) || 0) - 
        (monthlyTrends.get(recentMonths[recentMonths.length - 2]) || 0) : 0

      const topCategories = Array.from(categoryFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      const topItems = Array.from(itemFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const prompt = `
You are a smart shopping analytics assistant. Analyze the user's shopping data and provide 3-5 intelligent insights.

Shopping Data:
- Total items purchased: ${analytics.total_items}
- Completed items: ${analytics.completed_items}
- Total lists: ${analytics.total_lists}
- Most frequent category: ${analytics.most_frequent_category}
- Items this month: ${analytics.items_this_month}

Top categories by frequency:
${topCategories.map(([cat, count]) => `- ${cat}: ${count} items`).join('\n')}

Top items by frequency:
${topItems.map(([item, count]) => `- ${item}: ${count} times`).join('\n')}

Recent shopping trend: ${recentTrend > 0 ? 'increasing' : recentTrend < 0 ? 'decreasing' : 'stable'}

Shopping lists completion rates:
${Array.from(completionRates.entries()).map(([list, rates]) => 
  `- ${list}: ${Math.round((rates.completed / rates.total) * 100)}% completion`
).join('\n')}

Generate 3-5 intelligent insights about their shopping patterns. Consider:
1. Trends in their shopping behavior
2. Categories they might be neglecting
3. Items they buy frequently but might be running low on
4. Shopping efficiency and completion patterns
5. Seasonal or contextual recommendations

Return ONLY a valid JSON array with objects containing these exact fields:
- type: string (one of: "trend", "recommendation", "pattern", "alert", "achievement")
- title: string (short, catchy title)
- description: string (detailed explanation)
- confidence: number (0.1 to 1.0, how confident you are in this insight)

Example output:
[
  {
    "type": "trend",
    "title": "Shopping Frequency Increasing",
    "description": "Your shopping activity has increased by 15% this month compared to last month, suggesting you're becoming more organized with your grocery planning.",
    "confidence": 0.85
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

      const parsedInsights: any[] = JSON.parse(jsonMatch[0])

      // Transform to Insight objects with icons and colors
      return parsedInsights.map(insight => ({
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        ...getInsightStyling(insight.type)
      }))

    } catch (error) {
      console.error('Error generating AI insights:', error)
      throw error
    }
  }

  const getInsightStyling = (type: string) => {
    switch (type) {
      case 'trend':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-blue-500'
        }
      case 'recommendation':
        return {
          icon: <Lightbulb className="w-5 h-5" />,
          color: 'text-yellow-500'
        }
      case 'pattern':
        return {
          icon: <BarChart3 className="w-5 h-5" />,
          color: 'text-purple-500'
        }
      case 'alert':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-orange-500'
        }
      case 'achievement':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-500'
        }
      default:
        return {
          icon: <Brain className="w-5 h-5" />,
          color: 'text-gray-500'
        }
    }
  }

  const generateDemoInsights = (analytics: any, shoppingLists: any[]): Insight[] => {
    const insights: Insight[] = []

    // Demo trend insight
    insights.push({
      type: 'trend',
      title: 'Strong Shopping Momentum',
      description: `You've purchased ${analytics.items_this_month} items this month, showing excellent shopping consistency and planning.`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-blue-500',
      confidence: 0.9
    })

    // Demo achievement insight
    const completionRate = Math.round((analytics.completed_items / analytics.total_items) * 100)
    insights.push({
      type: 'achievement',
      title: 'Outstanding Completion Rate',
      description: `You've completed ${completionRate}% of your shopping items. Your organization skills are impressive!`,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-500',
      confidence: 0.95
    })

    // Demo recommendation insight
    insights.push({
      type: 'recommendation',
      title: 'Smart Category Focus',
      description: `Your top category is ${analytics.most_frequent_category}. Consider exploring related items to optimize your shopping trips.`,
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'text-yellow-500',
      confidence: 0.85
    })

    // Demo pattern insight
    insights.push({
      type: 'pattern',
      title: 'Efficient List Management',
      description: `You manage ${analytics.total_lists} shopping lists effectively. Your systematic approach saves time and reduces waste.`,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-purple-500',
      confidence: 0.8
    })

    return insights
  }

  const generateFallbackInsights = (analytics: any, shoppingLists: any[]): Insight[] => {
    const insights: Insight[] = []

    // Basic trend insight
    if (analytics.items_this_month > 0) {
      insights.push({
        type: 'trend',
        title: 'Active Shopping Month',
        description: `You've purchased ${analytics.items_this_month} items this month, showing consistent shopping activity.`,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-blue-500',
        confidence: 0.8
      })
    }

    // Completion rate insight
    if (analytics.total_items > 0) {
      const completionRate = Math.round((analytics.completed_items / analytics.total_items) * 100)
      if (completionRate >= 80) {
        insights.push({
          type: 'achievement',
          title: 'Excellent Completion Rate',
          description: `You've completed ${completionRate}% of your shopping items. Great job staying organized!`,
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-500',
          confidence: 0.9
        })
      } else if (completionRate < 50) {
        insights.push({
          type: 'alert',
          title: 'Low Completion Rate',
          description: `Only ${completionRate}% of items are completed. Consider reviewing your lists to improve efficiency.`,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-orange-500',
          confidence: 0.7
        })
      }
    }

    // Category insight
    if (analytics.most_frequent_category) {
      insights.push({
        type: 'pattern',
        title: 'Favorite Category',
        description: `${analytics.most_frequent_category} is your most shopped category, showing your shopping preferences.`,
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'text-purple-500',
        confidence: 0.8
      })
    }

    return insights
  }

  if (!apiKey) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">AI-Powered Insights</h3>
            <p className="text-sm text-glass-muted">Intelligent analysis of your shopping patterns</p>
          </div>
        </div>
        
        <div className="glass p-4 rounded-lg opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-glass">API Key Required</h4>
              <p className="text-sm text-glass-muted">
                Add your Gemini API key in settings to enable AI insights
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">AI-Powered Insights</h3>
            <p className="text-sm text-glass-muted">Intelligent analysis of your shopping patterns</p>
          </div>
        </div>
        
        <button
          onClick={generateInsights}
          disabled={loading}
          className="glass-button px-3 py-2 text-sm bg-blue-500/10 border-blue-200/30 hover:bg-blue-500/20"
          title="Refresh insights"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
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
          {[...Array(3)].map((_, i) => (
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
      ) : insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="glass p-4 rounded-lg border border-glass-white-border/50 hover:border-blue-200/30 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-${insight.color.split('-')[1]}-500/20 to-${insight.color.split('-')[1]}-600/20 flex items-center justify-center flex-shrink-0`}>
                  {insight.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-glass-heading">{insight.title}</h4>
                    {insight.confidence && (
                      <span className="text-xs px-2 py-1 rounded-full bg-glass-white-light/50 text-glass-muted">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-glass-muted leading-relaxed">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <button
                      onClick={insight.action.onClick}
                      className="mt-2 text-xs glass-button px-3 py-1 bg-blue-500/10 border-blue-200/30 hover:bg-blue-500/20"
                    >
                      {insight.action.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-6 rounded-lg text-center">
          <Brain className="w-12 h-12 text-glass-muted mx-auto mb-3" />
          <h4 className="font-medium text-glass mb-2">No insights yet</h4>
          <p className="text-sm text-glass-muted">
            Start adding items to your shopping lists to get personalized AI insights
          </p>
        </div>
      )}

      {/* Footer */}
      {insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-glass-white-border/30">
          <p className="text-xs text-glass-muted text-center">
            Insights are generated using AI analysis of your shopping patterns
          </p>
        </div>
      )}
    </div>
  )
}