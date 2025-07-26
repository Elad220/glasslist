import { supabase, isDemoMode } from './client'
import type { NewProfile, Profile } from './types'
import { ensureEncrypted, ensureDecrypted } from '../utils/encryption'

// Mock user data for demo mode
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@glasslist.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  role: 'authenticated'
}

const mockProfile: Profile = {
  id: 'demo-user-123',
  email: 'demo@glasslist.com',
  full_name: 'Demo User',
  avatar_url: null,
  gemini_api_key: null,
  ai_suggestions_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export async function signUp(email: string, password: string, fullName?: string) {
  if (isDemoMode || !supabase) {
    // Demo mode - simulate successful signup
    return {
      data: { user: mockUser, session: null },
      error: null
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  if (isDemoMode || !supabase) {
    // Demo mode - simulate successful signin
    return {
      data: { 
        user: mockUser, 
        session: {
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: mockUser
        }
      },
      error: null
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  if (isDemoMode || !supabase) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  if (isDemoMode || !supabase) {
    return { user: mockUser, error: null }
  }

  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getProfile(userId: string): Promise<{ profile: Profile | null; error: any }> {
  if (isDemoMode || !supabase) {
    return { profile: mockProfile, error: null }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Decrypt the API key if it exists
  if (profile && profile.gemini_api_key) {
    const decryptResult = ensureDecrypted(profile.gemini_api_key)
    if (decryptResult.success) {
      profile.gemini_api_key = decryptResult.data || null
    } else {
      console.error('Failed to decrypt API key:', decryptResult.error)
      profile.gemini_api_key = null
    }
  }

  return { profile, error }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  if (isDemoMode || !supabase) {
    return { data: { ...mockProfile, ...updates }, error: null }
  }

  // Encrypt the API key if it's being updated
  const updateData = { ...updates }
  if (updateData.gemini_api_key) {
    const encryptResult = ensureEncrypted(updateData.gemini_api_key)
    if (encryptResult.success) {
      updateData.gemini_api_key = encryptResult.data
    } else {
      console.error('Failed to encrypt API key:', encryptResult.error)
      return { data: null, error: { message: 'Failed to encrypt API key' } }
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  // Decrypt the API key in the returned data for immediate use
  if (data && data.gemini_api_key) {
    const decryptResult = ensureDecrypted(data.gemini_api_key)
    if (decryptResult.success) {
      data.gemini_api_key = decryptResult.data || null
    }
  }

  return { data, error }
}

export async function deleteAccount(userId: string) {
  if (isDemoMode || !supabase) {
    return { error: null }
  }

  // This will cascade delete all user data due to foreign key constraints
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { error }
} 