'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  ShoppingCart, 
  Target,
  Clock,
  DollarSign,
  Package,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Brain,
  ChartLine,
  PieChart
} from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase/client'
import { useToast } from '../lib/toast/context'

interface AnalyticsMetric {
  label: string
  value: string | number
  change?: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color: string
}

interface TrendData {
  period: string
  value: number
  change: number
}

interface AIShoppingAnalyticsProps {
  userId: string
  apiKey: string
  analytics: any
  shoppingLists: any[]
}

export default function AIShoppingAnalytics({ 
  userId, 
  apiKey, 
  analytics, 
  shoppingLists 
}: AIShoppingAnalyticsProps) {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (userId && apiKey && analytics && shoppingLists.length > 0) {
      generateAnalytics()
    }
  }, [userId, apiKey, analytics, shoppingLists])

  const generateAnalytics = async () => {
    if (!userId || !apiKey) return

    setLoading(true)
    try {
      // Get comprehensive shopping history
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
        .limit(500)

      if (historyError) {
        throw new Error(`Failed to fetch shopping history: ${historyError.message}`)
      }

      if (!historyData || historyData.length === 0) {
        setMetrics([])
        setTrends([])
        return
      }

      // Generate AI analytics
      const { aiMetrics, aiTrends } = await generateAIAnalytics(historyData, analytics, shoppingLists, apiKey)
      setMetrics(aiMetrics)
      setTrends(aiTrends)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error generating analytics:', error)
      toast.error('Failed to generate analytics', 'Please try again later')
      // Fallback to basic analytics
      const { basicMetrics, basicTrends } = generateFallbackAnalytics(analytics, shoppingLists)
      setMetrics(basicMetrics)
      setTrends(basicTrends)
    } finally {
      setLoading(false)
    }
  }

  const generateAIAnalytics = async (
    historyData: any[], 
    analytics: any, 
    shoppingLists: any[], 
    apiKey: string
  ): Promise<{ aiMetrics: AnalyticsMetric[], aiTrends: TrendData[] }> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Analyze shopping patterns
      const itemFrequency = new Map<string, number>()
      const categorySpending = new Map<string, number>()
      const monthlyData = new Map<string, { items: number, completed: number, categories: Set<string> }>()
      const shoppingDays = new Set<string>()
      const completionRates = new Map<string, number>()

      historyData.forEach(item => {
        const itemKey = item.name.toLowerCase().trim()
        const categoryKey = item.category
        const monthKey = new Date(item.created_at).toISOString().slice(0, 7)
        const shoppingDate = new Date(item.created_at).toDateString()
        
        itemFrequency.set(itemKey, (itemFrequency.get(itemKey) || 0) + 1)
        categorySpending.set(categoryKey, (categorySpending.get(categoryKey) || 0) + 1)
        shoppingDays.add(shoppingDate)
        
        const monthData = monthlyData.get(monthKey) || { items: 0, completed: 0, categories: new Set() }
        monthData.items++
        monthData.categories.add(categoryKey)
        if (item.is_checked) monthData.completed++
        monthlyData.set(monthKey, monthData)
        
        if (item.shopping_lists) {
          const listKey = item.shopping_lists.name
          const current = completionRates.get(listKey) || { total: 0, completed: 0 }
          current.total++
          if (item.is_checked) current.completed++
          completionRates.set(listKey, current)
        }
      })

      // Calculate advanced metrics
      const totalShoppingDays = shoppingDays.size
      const avgItemsPerTrip = historyData.length / totalShoppingDays
      const avgCompletionRate = Array.from(completionRates.values()).reduce((acc, rates) => 
        acc + (rates.completed / rates.total), 0) / completionRates.size
      
      const uniqueCategories = new Set(Array.from(categorySpending.keys())).size
      const mostFrequentItem = Array.from(itemFrequency.entries()).sort((a, b) => b[1] - a[1])[0]
      
      // Calculate trends
      const sortedMonths = Array.from(monthlyData.keys()).sort()
      const recentMonths = sortedMonths.slice(-3)
      const recentTrend = recentMonths.length >= 2 ? 
        (monthlyData.get(recentMonths[recentMonths.length - 1])?.items || 0) - 
        (monthlyData.get(recentMonths[recentMonths.length - 2])?.items || 0) : 0

      const prompt = `
You are a shopping analytics expert. Analyze the user's shopping data and provide advanced metrics and trends.

Shopping Data:
- Total items purchased: ${analytics.total_items}
- Completed items: ${analytics.completed_items}
- Total lists: ${analytics.total_lists}
- Items this month: ${analytics.items_this_month}
- Average items per shopping trip: ${avgItemsPerTrip.toFixed(1)}
- Average completion rate: ${(avgCompletionRate * 100).toFixed(1)}%
- Total shopping days: ${totalShoppingDays}
- Unique categories shopped: ${uniqueCategories}
- Most frequent item: ${mostFrequentItem ? `${mostFrequentItem[0]} (${mostFrequentItem[1]} times)` : 'None'}

Recent trend: ${recentTrend > 0 ? 'increasing' : recentTrend < 0 ? 'decreasing' : 'stable'}

Monthly breakdown (last 3 months):
${recentMonths.map(month => {
  const data = monthlyData.get(month)
  return `- ${month}: ${data?.items || 0} items, ${data?.completed || 0} completed, ${data?.categories.size || 0} categories`
}).join('\n')}

Generate 5-6 advanced shopping metrics and 3-4 trend insights. Consider:
1. Shopping efficiency and patterns
2. Category diversity and preferences
3. Completion rates and productivity
4. Seasonal trends and predictions
5. Cost optimization opportunities
6. Time management insights

Return ONLY a valid JSON object with these exact fields:
- metrics: array of objects with fields: label, value, change (number), trend ("up", "down", "stable")
- trends: array of objects with fields: period, value, change

Example output:
{
  "metrics": [
    {
      "label": "Shopping Efficiency",
      "value": "85%",
      "change": 12,
      "trend": "up"
    }
  ],
  "trends": [
    {
      "period": "This Month",
      "value": 45,
      "change": 15
    }
  ]
}
`

      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Clean the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI')
      }

      const parsedData: any = JSON.parse(jsonMatch[0])

      // Transform metrics with icons and colors
      const aiMetrics: AnalyticsMetric[] = (parsedData.metrics || []).map((metric: any) => ({
        label: metric.label,
        value: metric.value,
        change: metric.change,
        trend: metric.trend,
        ...getMetricStyling(metric.trend)
      }))

      const aiTrends: TrendData[] = parsedData.trends || []

      return { aiMetrics, aiTrends }

    } catch (error) {
      console.error('Error generating AI analytics:', error)
      throw error
    }
  }

  const getMetricStyling = (trend: string) => {
    switch (trend) {
      case 'up':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-green-500'
        }
      case 'down':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-red-500'
        }
      case 'stable':
        return {
          icon: <BarChart3 className="w-5 h-5" />,
          color: 'text-blue-500'
        }
      default:
        return {
          icon: <ChartLine className="w-5 h-5" />,
          color: 'text-gray-500'
        }
    }
  }

  const generateFallbackAnalytics = (analytics: any, shoppingLists: any[]): { basicMetrics: AnalyticsMetric[], basicTrends: TrendData[] } => {
    const basicMetrics: AnalyticsMetric[] = []

    // Shopping efficiency
    if (analytics.total_items > 0) {
      const completionRate = Math.round((analytics.completed_items / analytics.total_items) * 100)
      basicMetrics.push({
        label: 'Completion Rate',
        value: `${completionRate}%`,
        change: completionRate >= 80 ? 5 : completionRate >= 60 ? 0 : -10,
        trend: completionRate >= 80 ? 'up' : completionRate >= 60 ? 'stable' : 'down',
        icon: <CheckCircle className="w-5 h-5" />,
        color: completionRate >= 80 ? 'text-green-500' : completionRate >= 60 ? 'text-blue-500' : 'text-red-500'
      })
    }

    // Shopping frequency
    if (analytics.items_this_month > 0) {
      basicMetrics.push({
        label: 'Monthly Activity',
        value: `${analytics.items_this_month} items`,
        change: analytics.items_this_month > 20 ? 15 : analytics.items_this_month > 10 ? 5 : -5,
        trend: analytics.items_this_month > 20 ? 'up' : analytics.items_this_month > 10 ? 'stable' : 'down',
        icon: <ShoppingCart className="w-5 h-5" />,
        color: analytics.items_this_month > 20 ? 'text-green-500' : analytics.items_this_month > 10 ? 'text-blue-500' : 'text-red-500'
      })
    }

    // List management
    if (shoppingLists.length > 0) {
      const activeLists = shoppingLists.filter(list => list.itemCount > 0).length
      basicMetrics.push({
        label: 'Active Lists',
        value: `${activeLists}/${shoppingLists.length}`,
        change: activeLists > shoppingLists.length * 0.7 ? 10 : activeLists > shoppingLists.length * 0.5 ? 0 : -10,
        trend: activeLists > shoppingLists.length * 0.7 ? 'up' : activeLists > shoppingLists.length * 0.5 ? 'stable' : 'down',
        icon: <Package className="w-5 h-5" />,
        color: activeLists > shoppingLists.length * 0.7 ? 'text-green-500' : activeLists > shoppingLists.length * 0.5 ? 'text-blue-500' : 'text-red-500'
      })
    }

    // Category diversity
    if (analytics.most_frequent_category) {
      basicMetrics.push({
        label: 'Category Focus',
        value: analytics.most_frequent_category,
        change: 0,
        trend: 'stable',
        icon: <Target className="w-5 h-5" />,
        color: 'text-purple-500'
      })
    }

    const basicTrends: TrendData[] = [
      {
        period: 'This Month',
        value: analytics.items_this_month || 0,
        change: 0
      },
      {
        period: 'Last Month',
        value: Math.round((analytics.items_this_month || 0) * 0.9),
        change: -10
      },
      {
        period: '3 Months Ago',
        value: Math.round((analytics.items_this_month || 0) * 0.8),
        change: -20
      }
    ]

    return { basicMetrics, basicTrends }
  }

  if (!apiKey) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <ChartLine className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">AI Shopping Analytics</h3>
            <p className="text-sm text-glass-muted">Advanced shopping insights and trends</p>
          </div>
        </div>
        
        <div className="glass p-4 rounded-lg opacity-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-glass">API Key Required</h4>
              <p className="text-sm text-glass-muted">
                Add your Gemini API key in settings to enable advanced analytics
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
            <ChartLine className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">AI Shopping Analytics</h3>
            <p className="text-sm text-glass-muted">Advanced shopping insights and trends</p>
          </div>
        </div>
        
        <button
          onClick={generateAnalytics}
          disabled={loading}
          className="glass-button px-3 py-2 text-sm bg-purple-500/10 border-purple-200/30 hover:bg-purple-500/20"
          title="Refresh analytics"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-glass-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-glass-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-glass-muted rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          {metrics.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-glass-heading mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Key Metrics
              </h4>
              <div className="grid gap-3">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="glass p-3 rounded-lg border border-glass-white-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-${metric.color.split('-')[1]}-500/20 to-${metric.color.split('-')[1]}-600/20 flex items-center justify-center`}>
                          {metric.icon}
                        </div>
                        <div>
                          <p className="text-sm text-glass-muted">{metric.label}</p>
                          <p className="font-semibold text-glass-heading">{metric.value}</p>
                        </div>
                      </div>
                      
                      {metric.change !== undefined && (
                        <div className={`text-sm font-medium ${metric.change > 0 ? 'text-green-500' : metric.change < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends */}
          {trends.length > 0 && (
            <div>
              <h4 className="font-semibold text-glass-heading mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trends
              </h4>
              <div className="space-y-2">
                {trends.map((trend, index) => (
                  <div
                    key={index}
                    className="glass p-3 rounded-lg border border-glass-white-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-glass-heading">{trend.period}</p>
                        <p className="text-sm text-glass-muted">{trend.value} items</p>
                      </div>
                      
                      <div className={`text-sm font-medium ${trend.change > 0 ? 'text-green-500' : trend.change < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics.length === 0 && trends.length === 0 && (
            <div className="glass p-6 rounded-lg text-center">
              <ChartLine className="w-12 h-12 text-glass-muted mx-auto mb-3" />
              <h4 className="font-medium text-glass mb-2">No analytics yet</h4>
              <p className="text-sm text-glass-muted">
                Start shopping to get AI-powered analytics insights
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      {(metrics.length > 0 || trends.length > 0) && (
        <div className="mt-4 pt-4 border-t border-glass-white-border/30">
          <p className="text-xs text-glass-muted text-center">
            Analytics are generated using AI analysis of your shopping patterns
          </p>
        </div>
      )}
    </div>
  )
}