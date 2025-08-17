import { supabase } from '../supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { UnitType } from '../supabase/types'

export interface SuggestedItem {
  name: string
  category: string
  unit: UnitType
  confidence: number
  reason: string
  lastPurchased?: string
  frequency: number
}

export interface SuggestionsResponse {
  items: SuggestedItem[]
  success: boolean
  error?: string
}

const COMMON_CATEGORIES = [
  'Produce', 'Dairy', 'Meat & Seafood', 'Bakery', 'Pantry', 'Frozen', 
  'Beverages', 'Snacks', 'Health & Beauty', 'Household', 'Baby', 'Pet', 'General',
  'Organics', 'Registers', 'Canned Goods', 'Disposable', 'Freezer'
]

const VALID_UNITS: UnitType[] = [
  'pcs', 'kg', 'g', 'L', 'ml', 'pack', 'dozen', 'box', 'jar', 'bottle',
  'can', 'bag', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'head', 'slice'
]

export async function getAISuggestions(
  userId: string,
  apiKey: string,
  limit: number = 10
): Promise<SuggestionsResponse> {
  if (!apiKey || !userId) {
    return {
      items: [],
      success: false,
      error: 'API key and user ID are required'
    }
  }

  try {
    if (!supabase) {
      return {
        items: [],
        success: false,
        error: 'Database connection not available'
      }
    }
    
    // Get user's shopping history
    const { data: historyData, error: historyError } = await supabase
      .from('items')
      .select(`
        name,
        category,
        unit,
        created_at,
        shopping_lists!inner(id, user_id)
      `)
      .eq('shopping_lists.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (historyError) {
      throw new Error(`Failed to fetch shopping history: ${historyError.message}`)
    }

    if (!historyData || historyData.length === 0) {
      return {
        items: [],
        success: true
      }
    }

    // Analyze shopping patterns
    const itemFrequency = new Map<string, {
      count: number
      categories: Set<string>
      units: Set<string>
      lastPurchased: string
    }>()

    historyData.forEach(item => {
      const key = item.name.toLowerCase().trim()
      const existing = itemFrequency.get(key)
      
      if (existing) {
        existing.count++
        if (item.category) existing.categories.add(item.category)
        if (item.unit) existing.units.add(item.unit)
        if (item.created_at > existing.lastPurchased) {
          existing.lastPurchased = item.created_at
        }
      } else {
        itemFrequency.set(key, {
          count: 1,
          categories: new Set(item.category ? [item.category] : []),
          units: new Set(item.unit ? [item.unit] : []),
          lastPurchased: item.created_at
        })
      }
    })

    // Get recent items (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentItems = historyData.filter(item => 
      new Date(item.created_at) > thirtyDaysAgo
    )

    // Use AI to generate contextual suggestions
    const suggestions = await generateAISuggestions(
      Array.from(itemFrequency.entries()),
      recentItems,
      apiKey,
      limit
    )

    return {
      items: suggestions,
      success: true
    }

  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return {
      items: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

async function generateAISuggestions(
  itemFrequency: [string, { count: number; categories: Set<string>; units: Set<string>; lastPurchased: string }][],
  recentItems: any[],
  apiKey: string,
  limit: number
): Promise<SuggestedItem[]> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Prepare shopping history data
    const topItems = itemFrequency
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, data]) => ({
        name,
        frequency: data.count,
        categories: Array.from(data.categories),
        units: Array.from(data.units),
        lastPurchased: data.lastPurchased
      }))

    const recentItemNames = recentItems.map(item => item.name)

    const prompt = `
You are a smart shopping assistant. Based on the user's shopping history, suggest items they might need to buy.

User's shopping history (most frequent items):
${topItems.map(item => `- ${item.name} (bought ${item.frequency} times, categories: ${item.categories.join(', ')}, units: ${item.units.join(', ')})`).join('\n')}

Recently purchased items (last 30 days):
${recentItemNames.join(', ')}

Generate ${limit} smart suggestions for items the user might need to buy. Consider:
1. Items they buy frequently but haven't bought recently
2. Complementary items to what they've bought recently
3. Seasonal items or common household staples
4. Items that go well with their shopping patterns

Return ONLY a valid JSON array with objects containing these exact fields:
- name: string (item name)
- category: string (one of: ${COMMON_CATEGORIES.join(', ')})
- unit: string (one of: ${VALID_UNITS.join(', ')})
- confidence: number (0.1 to 1.0, how confident you are they need this)
- reason: string (brief explanation why you're suggesting this item)
- frequency: number (how often they typically buy this, estimate based on patterns)

Rules:
1. Don't suggest items they just bought recently
2. Focus on items they buy regularly but might have forgotten
3. Consider seasonal patterns and common household needs
4. Be realistic about quantities and units
5. Return ONLY the JSON array, no other text

Example output:
[
  {
    "name": "milk",
    "category": "Dairy",
    "unit": "L",
    "confidence": 0.9,
    "reason": "You buy milk frequently but haven't purchased it recently",
    "frequency": 2
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

    const parsedSuggestions: any[] = JSON.parse(jsonMatch[0])

    // Validate and clean the parsed suggestions
    const validatedSuggestions = parsedSuggestions
      .filter(item => item.name && item.name.trim())
      .map(item => ({
        name: item.name.trim(),
        category: COMMON_CATEGORIES.includes(item.category) ? item.category : 'General',
        unit: VALID_UNITS.includes(item.unit) ? item.unit : 'pcs',
        confidence: Math.max(0.1, Math.min(1.0, Number(item.confidence) || 0.5)),
        reason: item.reason?.trim() || 'Based on your shopping patterns',
        frequency: Math.max(1, Number(item.frequency) || 1),
        lastPurchased: itemFrequency.find(([name]) => 
          name.toLowerCase() === item.name.toLowerCase()
        )?.[1].lastPurchased
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)

    return validatedSuggestions

  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    
    // Fallback to basic suggestions based on frequency
    return generateFallbackSuggestions(itemFrequency, limit)
  }
}

function generateFallbackSuggestions(
  itemFrequency: [string, { count: number; categories: Set<string>; units: Set<string>; lastPurchased: string }][],
  limit: number
): SuggestedItem[] {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return itemFrequency
    .filter(([_, data]) => {
      // Filter out items purchased recently
      return new Date(data.lastPurchased) < thirtyDaysAgo
    })
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([name, data]) => {
      const mostCommonCategory = Array.from(data.categories)[0] || 'General'
      const mostCommonUnit = Array.from(data.units)[0] || 'pcs'
      
      return {
        name,
        category: mostCommonCategory,
        unit: mostCommonUnit as UnitType,
        confidence: Math.min(0.8, 0.3 + (data.count * 0.1)),
        reason: `You buy this item frequently (${data.count} times)`,
        frequency: data.count,
        lastPurchased: data.lastPurchased
      }
    })
}

export async function addSuggestedItemToList(
  listId: string,
  item: SuggestedItem
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Database connection not available'
      }
    }
    
    const { error } = await supabase
      .from('items')
      .insert({
        list_id: listId,
        name: item.name,
        amount: 1,
        unit: item.unit,
        category: item.category,
        notes: `AI suggested: ${item.reason}`
      })

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error adding suggested item to list:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to list'
    }
  }
}