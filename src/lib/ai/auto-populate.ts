import { GoogleGenerativeAI } from '@google/generative-ai'
import type { UnitType } from '../supabase/types'

export interface AutoPopulateResponse {
  amount: number
  unit: UnitType
  category: string
  notes?: string
  success: boolean
  error?: string
}

const VALID_UNITS: UnitType[] = [
  'pcs', 'kg', 'g', 'L', 'ml', 'pack', 'dozen', 'box', 'jar', 'bottle',
  'can', 'bag', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'head', 'slice'
]

const COMMON_CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Hygiene', 'Household', 'Snacks', 
  'Beverages', 'Organics', 'Registers', 'Canned Goods', 'Freezer', 'Other'
]

export async function autoPopulateItemDetails(
  itemName: string,
  apiKey: string
): Promise<AutoPopulateResponse> {
  if (!apiKey || !itemName.trim()) {
    return {
      amount: 1,
      unit: 'pcs',
      category: 'Other',
      success: false,
      error: 'API key and item name are required'
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
You are a shopping item analyzer. Given an item name, suggest appropriate default values for a shopping list item.

Item name: "${itemName}"

Return ONLY a valid JSON object with these exact fields:
- amount: number (suggested quantity, default to 1 if unclear)
- unit: string (one of: ${VALID_UNITS.join(', ')})
- category: string (one of: ${COMMON_CATEGORIES.join(', ')})
- notes: string (optional, for any helpful notes about the item)

Rules:
1. Choose the most appropriate unit based on the item type
2. Suggest a reasonable default quantity (1 for most items)
3. Categorize items logically (e.g., "milk" → "Dairy", "apples" → "Produce")
4. Add helpful notes for items that might need clarification
5. Return ONLY the JSON object, no other text

Examples:
- "milk" → {"amount": 1, "unit": "L", "category": "Dairy", "notes": "Consider organic or preferred brand"}
- "bananas" → {"amount": 1, "unit": "bunch", "category": "Produce", "notes": "Choose ripe bananas"}
- "chicken breast" → {"amount": 1, "unit": "lb", "category": "Meat", "notes": "Check for best before date"}
- "bread" → {"amount": 1, "unit": "pcs", "category": "Bakery", "notes": "Whole grain or preferred type"}
- "toothpaste" → {"amount": 1, "unit": "pcs", "category": "Hygiene", "notes": "Check for fluoride content"}
`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }

    const parsedData = JSON.parse(jsonMatch[0])

    // Validate and clean the parsed data
    const validatedData = {
      amount: Math.max(Number(parsedData.amount) || 1, 0.01),
      unit: VALID_UNITS.includes(parsedData.unit) ? parsedData.unit : 'pcs',
      category: COMMON_CATEGORIES.includes(parsedData.category) ? parsedData.category : 'Other',
      notes: parsedData.notes?.trim() || undefined
    }

    return {
      ...validatedData,
      success: true
    }

  } catch (error) {
    console.error('AI auto-populate error:', error)
    return {
      amount: 1,
      unit: 'pcs',
      category: 'Other',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-populate item details'
    }
  }
}

export function fallbackAutoPopulate(itemName: string): AutoPopulateResponse {
  // Simple fallback logic for when AI fails
  const lowerName = itemName.toLowerCase()
  
  // Basic unit detection
  let unit: UnitType = 'pcs'
  if (lowerName.includes('milk') || lowerName.includes('juice') || lowerName.includes('water')) {
    unit = 'L'
  } else if (lowerName.includes('banana') || lowerName.includes('grapes')) {
    unit = 'bunch'
  } else if (lowerName.includes('egg')) {
    unit = 'dozen'
  } else if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork')) {
    unit = 'lb'
  } else if (lowerName.includes('apple') || lowerName.includes('orange') || lowerName.includes('tomato')) {
    unit = 'pcs'
  }

  // Basic category detection
  let category = 'Other'
  if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt') || lowerName.includes('egg')) {
    category = 'Dairy'
  } else if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('tomato') || lowerName.includes('lettuce')) {
    category = 'Produce'
  } else if (lowerName.includes('bread') || lowerName.includes('cake') || lowerName.includes('cookie')) {
    category = 'Bakery'
  } else if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish')) {
    category = 'Meat'
  } else if (lowerName.includes('toothpaste') || lowerName.includes('soap') || lowerName.includes('shampoo')) {
    category = 'Hygiene'
  }

  // Basic notes
  let notes: string | undefined
  if (lowerName.includes('milk')) {
    notes = 'Consider organic or preferred brand'
  } else if (lowerName.includes('banana')) {
    notes = 'Choose ripe bananas'
  } else if (lowerName.includes('chicken')) {
    notes = 'Check for best before date'
  }

  return {
    amount: 1,
    unit,
    category,
    notes,
    success: true
  }
} 