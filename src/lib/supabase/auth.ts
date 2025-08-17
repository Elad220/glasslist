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
  ai_auto_populate_enabled: false,
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

  // Profile loaded successfully

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

  if (error) {
    return { data: null, error }
  }

  // Decrypt the API key in the returned data for immediate use
  if (data && data.gemini_api_key) {
    const decryptResult = ensureDecrypted(data.gemini_api_key)
    if (decryptResult.success) {
      data.gemini_api_key = decryptResult.data || null
    }
  }

  return { data, error }
}

export async function signInWithGoogle() {
  if (isDemoMode || !supabase) {
    // Demo mode - simulate successful Google signin
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  return { data, error }
}

export async function handleOAuthCallback() {
  if (isDemoMode || !supabase) {
    return { session: null, error: null }
  }

  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return { session: null, error }
    }
    
    if (session?.user) {
      // If this is a Google OAuth user, sync their profile
      if (session.user.app_metadata.provider === 'google') {
        const syncResult = await syncGoogleProfile(session.user)
        if (syncResult.error) {
          console.error('Profile sync error:', syncResult.error)
          // Don't fail the auth flow for profile sync errors
        }
      }
    }
    
    return { session, error: null }
  } catch (err) {
    console.error('OAuth callback error:', err)
    return { session: null, error: err }
  }
}

export async function syncGoogleProfile(user: any) {
  if (isDemoMode || !supabase) {
    return { data: mockProfile, error: null }
  }

  try {
    // Get existing profile to check for conflicts
    const { profile: existingProfile, error: profileError } = await getProfile(user.id)
    
    // Extract Google profile data
    const googleData = {
      full_name: user.user_metadata.full_name || user.user_metadata.name || null,
      avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
      email: user.email
    }

    // Determine what to update based on existing data and preferences
    const updateData: Partial<Profile> = {}

    // Always update email if it's from Google
    if (googleData.email) {
      updateData.email = googleData.email
    }

    // Update name if we don't have one or if Google data is newer
    if (googleData.full_name) {
      if (!existingProfile?.full_name || shouldUpdateFromGoogle(existingProfile, 'full_name')) {
        updateData.full_name = googleData.full_name
      }
    }

    // Update avatar if we don't have one or if Google data is newer
    if (googleData.avatar_url) {
      if (!existingProfile?.avatar_url || shouldUpdateFromGoogle(existingProfile, 'avatar_url')) {
        updateData.avatar_url = googleData.avatar_url
      }
    }

    // Only update if we have changes to make
    if (Object.keys(updateData).length > 0) {
      return updateProfile(user.id, updateData)
    }

    return { data: existingProfile, error: null }
  } catch (error) {
    console.error('Error syncing Google profile:', error)
    return { data: null, error }
  }
}

function shouldUpdateFromGoogle(existingProfile: Profile, field: keyof Profile): boolean {
  // For now, we'll prioritize Google data if the existing data is empty
  // In the future, we could add user preferences or timestamp comparison
  const existingValue = existingProfile[field]
  return !existingValue || existingValue === null || existingValue === ''
}

export async function handleProfileConflict(googleEmail: string, existingUserId: string) {
  if (isDemoMode || !supabase) {
    return { canLink: true, error: null }
  }

  try {
    // Check if there's already a user with this Google email
    const { data: existingUsers, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', googleEmail)
      .neq('id', existingUserId)

    if (error) {
      return { canLink: false, error: 'Failed to check for existing accounts' }
    }

    if (existingUsers && existingUsers.length > 0) {
      return { 
        canLink: false, 
        error: 'This Google account is already associated with another user account.' 
      }
    }

    return { canLink: true, error: null }
  } catch (error) {
    console.error('Error checking profile conflict:', error)
    return { canLink: false, error: 'Failed to verify account linking' }
  }
}

export async function handleGoogleSignInError(error: any) {
  if (!error) return 'An unknown error occurred'
  
  const errorMessage = error.message || error.error_description || ''
  const errorCode = error.error || error.code || ''
  
  // User cancellation
  if (errorMessage.includes('cancelled') || errorMessage.includes('denied') || 
      errorCode === 'access_denied' || errorMessage.includes('popup_closed')) {
    return 'Sign-in was cancelled. Please try again.'
  }
  
  // Network/connection errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') ||
      errorMessage.includes('timeout') || errorCode === 'network_error') {
    return 'Unable to connect to Google. Please check your internet connection and try again.'
  }
  
  // Configuration errors
  if (errorMessage.includes('client_id') || errorMessage.includes('invalid_client') ||
      errorCode === 'invalid_client' || errorMessage.includes('configuration')) {
    return 'Authentication service is temporarily unavailable. Please try again later.'
  }
  
  // Account conflicts
  if (errorMessage.includes('already registered') || errorMessage.includes('email') ||
      errorMessage.includes('account exists') || errorCode === 'email_already_exists') {
    return 'This Google account is already associated with another user.'
  }
  
  // OAuth specific errors
  if (errorCode === 'invalid_request') {
    return 'Invalid authentication request. Please try again.'
  }
  
  if (errorCode === 'unauthorized_client') {
    return 'Authentication service error. Please try again later.'
  }
  
  if (errorCode === 'invalid_scope') {
    return 'Permission error. Please try again.'
  }
  
  // Generic fallback
  console.error('Unhandled Google sign-in error:', { error, errorMessage, errorCode })
  return 'An error occurred during sign-in. Please try again or use email/password instead.'
}

export function isOAuthCallback() {
  if (typeof window === 'undefined') return false
  
  const url = new URL(window.location.href)
  return url.searchParams.has('code') && url.searchParams.has('state')
}

export async function deleteAccount(userId: string) {
  if (isDemoMode || !supabase) {
    return { error: null }
  }

  // This will cascade delete all user data due to foreign key constraints
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { error }
} 