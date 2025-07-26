import { GoogleGenerativeAI } from '@google/generative-ai'
import type { NewItem, UnitType } from '../supabase/types'

export interface ParsedItem {
  name: string
  amount: number
  unit: UnitType
  category: string
  notes?: string
}

export interface QuickAddResponse {
  items: ParsedItem[]
  success: boolean
  error?: string
}

const VALID_UNITS: UnitType[] = [
  'pcs', 'kg', 'g', 'L', 'ml', 'pack', 'dozen', 'box', 'jar', 'bottle',
  'can', 'bag', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'head', 'slice'
]

const COMMON_CATEGORIES = [
  'Produce', 'Dairy', 'Meat & Seafood', 'Bakery', 'Pantry', 'Frozen', 
  'Beverages', 'Snacks', 'Health & Beauty', 'Household', 'Baby', 'Pet', 'General'
]

export async function parseShoppingListWithAI(
  userInput: string,
  apiKey: string
): Promise<QuickAddResponse> {
  if (!apiKey || !userInput.trim()) {
    return {
      items: [],
      success: false,
      error: 'API key and input text are required'
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
You are a shopping list parser. Parse the following text into individual shopping items and return a JSON array.

Input text: "${userInput}"

Return ONLY a valid JSON array with objects containing these exact fields:
- name: string (item name, normalized)
- amount: number (quantity, default to 1 if not specified)
- unit: string (one of: ${VALID_UNITS.join(', ')})
- category: string (one of: ${COMMON_CATEGORIES.join(', ')})
- notes: string (optional, for any extra details)

Rules:
1. Normalize item names (e.g., "tomatos" → "tomatoes")
2. Choose the most appropriate unit (default to "pcs" for countable items)
3. Categorize items logically (e.g., "milk" → "Dairy", "apples" → "Produce")
4. If amount/unit is unclear, use reasonable defaults
5. Split combined items (e.g., "bread and butter" → separate items)
6. Return ONLY the JSON array, no other text

Example input: "2 liters of milk, a loaf of bread, and a dozen eggs"
Example output: [
  {"name": "milk", "amount": 2, "unit": "L", "category": "Dairy"},
  {"name": "bread", "amount": 1, "unit": "pcs", "category": "Bakery"},
  {"name": "eggs", "amount": 12, "unit": "pcs", "category": "Dairy"}
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

    const parsedItems: ParsedItem[] = JSON.parse(jsonMatch[0])

    // Validate and clean the parsed items
    const validatedItems = parsedItems
      .filter(item => item.name && item.name.trim())
      .map(item => ({
        name: item.name.trim(),
        amount: Math.max(Number(item.amount) || 1, 0.01),
        unit: VALID_UNITS.includes(item.unit) ? item.unit : 'pcs',
        category: COMMON_CATEGORIES.includes(item.category) ? item.category : 'General',
        notes: item.notes?.trim() || undefined
      }))

    return {
      items: validatedItems,
      success: true
    }

  } catch (error) {
    console.error('AI parsing error:', error)
    return {
      items: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse shopping list'
    }
  }
}

export function fallbackParseShoppingList(userInput: string): ParsedItem[] {
  // Simple fallback parser for when AI fails
  const lines = userInput
    .split(/[,\n]/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  return lines.map(line => {
    // Basic parsing logic
    const amountMatch = line.match(/^(\d+(?:\.\d+)?)\s*(.+)/)
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 1
    const name = amountMatch ? amountMatch[2].trim() : line.trim()

    // Simple unit detection
    let unit: UnitType = 'pcs'
    if (name.includes('kg') || name.includes('kilogram')) unit = 'kg'
    else if (name.includes('g') || name.includes('gram')) unit = 'g'
    else if (name.includes('L') || name.includes('liter')) unit = 'L'
    else if (name.includes('ml') || name.includes('milliliter')) unit = 'ml'
    else if (name.includes('dozen')) unit = 'dozen'
    else if (name.includes('pack') || name.includes('package')) unit = 'pack'

    // Basic category detection
    let category = 'General'
    const lowerName = name.toLowerCase()
    if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt')) {
      category = 'Dairy'
    } else if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('vegetable')) {
      category = 'Produce'
    } else if (lowerName.includes('bread') || lowerName.includes('cake')) {
      category = 'Bakery'
    } else if (lowerName.includes('meat') || lowerName.includes('chicken') || lowerName.includes('fish')) {
      category = 'Meat & Seafood'
    }

    return {
      name: name.replace(/\b(kg|g|L|ml|dozen|pack|package)\b/gi, '').trim(),
      amount,
      unit,
      category
    }
  })
}

export async function analyzeVoiceRecording(
  base64Audio: string,
  apiKey: string
): Promise<QuickAddResponse> {
  if (!apiKey || !base64Audio) {
    return {
      items: [],
      success: false,
      error: 'API key and audio data are required'
    }
  }

  try {
    console.log('Starting voice analysis with Gemini...');
    
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
You are a voice-to-shopping-list analyzer. I will provide you with an audio recording of someone speaking their shopping list items. Your task is to:

1. Transcribe the speech to text
2. Parse the transcribed text into individual shopping items
3. Return a JSON array of parsed items

Return ONLY a valid JSON array with objects containing these exact fields:
- name: string (item name, normalized)
- amount: number (quantity, default to 1 if not specified)
- unit: string (one of: ${VALID_UNITS.join(', ')})
- category: string (one of: ${COMMON_CATEGORIES.join(', ')})
- notes: string (optional, for any extra details)

Rules:
1. Normalize item names (e.g., "tomatos" → "tomatoes")
2. Choose the most appropriate unit (default to "pcs" for countable items)
3. Categorize items logically (e.g., "milk" → "Dairy", "apples" → "Produce")
4. If amount/unit is unclear, use reasonable defaults
5. Split combined items (e.g., "bread and butter" → separate items)
6. Handle speech recognition errors gracefully
7. Return ONLY the JSON array, no other text

Example output: [
  {"name": "milk", "amount": 2, "unit": "L", "category": "Dairy"},
  {"name": "bread", "amount": 1, "unit": "pcs", "category": "Bakery"},
  {"name": "eggs", "amount": 12, "unit": "pcs", "category": "Dairy"}
]
`

    // Try different audio formats that Gemini might support
    const audioFormats = [
      { mimeType: 'audio/webm', description: 'WebM audio' },
      { mimeType: 'audio/mp4', description: 'MP4 audio' },
      { mimeType: 'audio/wav', description: 'WAV audio' }
    ];

    let lastError = null;
    
    for (const format of audioFormats) {
      try {
        console.log(`Trying ${format.description}...`);
        
        const audioPart = {
          inlineData: {
            data: base64Audio,
            mimeType: format.mimeType
          }
        }

        console.log('Sending audio to Gemini...', { 
          audioDataLength: base64Audio.length,
          mimeType: format.mimeType
        });

        const result = await model.generateContent([prompt, audioPart])
        const response = result.response
        const text = response.text()

        console.log('Gemini response received:', { 
          responseLength: text.length,
          responsePreview: text.substring(0, 200) + '...'
        });

        // Clean the response to extract just the JSON
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          console.error('No JSON array found in response:', text);
          throw new Error('Invalid response format from AI - no JSON array found')
        }

        const parsedItems: ParsedItem[] = JSON.parse(jsonMatch[0])

        console.log('Parsed items from JSON:', parsedItems);

        // Validate and clean the parsed items
        const validatedItems = parsedItems
          .filter(item => item.name && item.name.trim())
          .map(item => ({
            name: item.name.trim(),
            amount: Math.max(Number(item.amount) || 1, 0.01),
            unit: VALID_UNITS.includes(item.unit) ? item.unit : 'pcs',
            category: COMMON_CATEGORIES.includes(item.category) ? item.category : 'General',
            notes: item.notes?.trim() || undefined
          }))

        console.log('Validated items:', validatedItems);

        return {
          items: validatedItems,
          success: true
        }
        
      } catch (error) {
        console.log(`${format.description} failed:`, error);
        lastError = error;
        continue; // Try next format
      }
    }

    // If all formats failed, throw the last error
    throw lastError || new Error('All audio formats failed');

  } catch (error) {
    console.error('Voice analysis error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to analyze voice recording';
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key. Please check your Gemini API key.';
      } else if (error.message.includes('audio') || error.message.includes('format')) {
        errorMessage = 'Audio format not supported by Gemini. Please try recording again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'AI response format error. Please try recording again.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      items: [],
      success: false,
      error: errorMessage
    }
  }
} 