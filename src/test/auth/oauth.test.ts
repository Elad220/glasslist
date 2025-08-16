import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  signInWithGoogle,
  handleOAuthCallback,
  syncGoogleProfile,
  handleProfileConflict,
  handleGoogleSignInError,
  isOAuthCallback,
} from '@/lib/supabase/auth'
import { mockSupabaseClient, mockUser, mockSession, mockProfile, resetMocks } from '../mocks/supabase'

// Mock window.location for OAuth callback tests
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  search: '',
  pathname: '/',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('Google OAuth Authentication', () => {
  beforeEach(() => {
    resetMocks()
    mockLocation.search = ''
    mockLocation.href = 'http://localhost:3000'
  })

  describe('signInWithGoogle', () => {
    it('should initiate OAuth flow with correct parameters', async () => {
      const { data, error } = await signInWithGoogle()

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/dashboard',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      expect(data).toBeDefined()
      expect(error).toBeNull()
    })

    it('should handle OAuth initiation errors', async () => {
      const mockError = { message: 'OAuth configuration error' }
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const { data, error } = await signInWithGoogle()

      expect(data).toBeNull()
      expect(error).toEqual(mockError)
    })

    it('should work in demo mode', async () => {
      // Mock demo mode
      vi.doMock('@/lib/supabase/client', () => ({
        supabase: null,
        isDemoMode: true,
      }))

      const { signInWithGoogle: demoSignIn } = await import('@/lib/supabase/auth')
      const { data, error } = await demoSignIn()

      expect(data.user).toBeDefined()
      expect(data.session).toBeDefined()
      expect(error).toBeNull()
    })
  })

  describe('handleOAuthCallback', () => {
    it('should process successful OAuth callback', async () => {
      const { session, error } = await handleOAuthCallback()

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
      expect(session).toEqual(mockSession)
      expect(error).toBeNull()
    })

    it('should sync Google profile for Google OAuth users', async () => {
      const googleUser = {
        ...mockUser,
        app_metadata: { provider: 'google', providers: ['google'] },
      }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { ...mockSession, user: googleUser } },
        error: null,
      })

      const { session, error } = await handleOAuthCallback()

      expect(session?.user).toEqual(googleUser)
      expect(error).toBeNull()
    })

    it('should handle session errors', async () => {
      const mockError = { message: 'Session error' }
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      })

      const { session, error } = await handleOAuthCallback()

      expect(session).toBeNull()
      expect(error).toEqual(mockError)
    })

    it('should handle callback without session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { session, error } = await handleOAuthCallback()

      expect(session).toBeNull()
      expect(error).toBeNull()
    })
  })

  describe('syncGoogleProfile', () => {
    it('should sync Google profile data for new user', async () => {
      // Mock no existing profile
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found error
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(mockUser)

      expect(data).toBeDefined()
      expect(error).toBeNull()
    })

    it('should update existing profile with Google data', async () => {
      const existingProfile = {
        ...mockProfile,
        full_name: null,
        avatar_url: null,
      }

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: existingProfile,
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { ...existingProfile, ...mockProfile },
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(mockUser)

      expect(data).toBeDefined()
      expect(error).toBeNull()
    })

    it('should preserve existing profile data when Google data is empty', async () => {
      const userWithoutMetadata = {
        ...mockUser,
        user_metadata: {
          email: 'test@example.com',
        },
      }

      const { data, error } = await syncGoogleProfile(userWithoutMetadata)

      expect(data).toEqual(mockProfile)
      expect(error).toBeNull()
    })

    it('should handle sync errors gracefully', async () => {
      const mockError = { message: 'Database error' }
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(mockError),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(mockUser)

      expect(data).toBeNull()
      expect(error).toEqual(mockError)
    })
  })

  describe('handleProfileConflict', () => {
    it('should allow linking when no conflicts exist', async () => {
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockResolvedValue({
              data: [], // No existing users with this email
              error: null,
            }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { canLink, error } = await handleProfileConflict('test@example.com', 'user-123')

      expect(canLink).toBe(true)
      expect(error).toBeNull()
    })

    it('should prevent linking when email conflict exists', async () => {
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockResolvedValue({
              data: [{ id: 'other-user', email: 'test@example.com' }],
              error: null,
            }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { canLink, error } = await handleProfileConflict('test@example.com', 'user-123')

      expect(canLink).toBe(false)
      expect(error).toBe('This Google account is already associated with another user account.')
    })

    it('should handle database errors', async () => {
      const mockError = { message: 'Database error' }
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockRejectedValue(mockError),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { canLink, error } = await handleProfileConflict('test@example.com', 'user-123')

      expect(canLink).toBe(false)
      expect(error).toBe('Failed to verify account linking')
    })
  })

  describe('handleGoogleSignInError', () => {
    it('should handle user cancellation errors', async () => {
      const error = { message: 'User cancelled OAuth', code: 'access_denied' }
      const friendlyError = await handleGoogleSignInError(error)
      
      expect(friendlyError).toBe('Sign-in was cancelled. Please try again.')
    })

    it('should handle network errors', async () => {
      const error = { message: 'Network connection failed', code: 'network_error' }
      const friendlyError = await handleGoogleSignInError(error)
      
      expect(friendlyError).toBe('Unable to connect to Google. Please check your internet connection and try again.')
    })

    it('should handle configuration errors', async () => {
      const error = { message: 'Invalid client_id', code: 'invalid_client' }
      const friendlyError = await handleGoogleSignInError(error)
      
      expect(friendlyError).toBe('Authentication service is temporarily unavailable. Please try again later.')
    })

    it('should handle account conflicts', async () => {
      const error = { message: 'Email already registered', code: 'email_already_exists' }
      const friendlyError = await handleGoogleSignInError(error)
      
      expect(friendlyError).toBe('This Google account is already associated with another user.')
    })

    it('should provide generic fallback for unknown errors', async () => {
      const error = { message: 'Unknown error', code: 'unknown' }
      const friendlyError = await handleGoogleSignInError(error)
      
      expect(friendlyError).toBe('An error occurred during sign-in. Please try again or use email/password instead.')
    })

    it('should handle null/undefined errors', async () => {
      const friendlyError = await handleGoogleSignInError(null)
      
      expect(friendlyError).toBe('An unknown error occurred')
    })
  })

  describe('isOAuthCallback', () => {
    it('should detect OAuth callback URL with code and state', () => {
      mockLocation.href = 'http://localhost:3000/auth/callback?code=123&state=abc'
      mockLocation.search = '?code=123&state=abc'
      
      // Mock URL constructor
      global.URL = class URL {
        searchParams: URLSearchParams
        
        constructor(url: string) {
          this.searchParams = new URLSearchParams('?code=123&state=abc')
        }
      } as any

      const result = isOAuthCallback()
      expect(result).toBe(true)
    })

    it('should not detect OAuth callback without required parameters', () => {
      mockLocation.href = 'http://localhost:3000/auth/callback'
      mockLocation.search = ''
      
      global.URL = class URL {
        searchParams: URLSearchParams
        
        constructor(url: string) {
          this.searchParams = new URLSearchParams('')
        }
      } as any

      const result = isOAuthCallback()
      expect(result).toBe(false)
    })

    it('should handle server-side rendering', () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window

      const result = isOAuthCallback()
      expect(result).toBe(false)

      // Restore window
      global.window = originalWindow
    })
  })
})