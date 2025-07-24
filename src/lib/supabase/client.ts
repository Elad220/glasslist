import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export const createClient = () => {
  if (isDemoMode || !supabaseUrl || !supabaseKey) {
    // Return a mock client for demo mode
    console.warn('Running in demo mode - Supabase not configured')
    return null
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

export const supabase = createClient()
export { isDemoMode } 