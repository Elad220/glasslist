import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  handleGoogleSignInError,
  signInWithGoogle,
  handleOAuthCallback,
  syncGoogleProfile,
} from '@/lib/supabase/auth'
import { mockSupabaseClient, resetMocks } from '../mocks/supabase'

describe('OAuth Error Handling and Fallbacks', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('Error Message Handling', () => {
    it('should handle user cancellation scenarios', async () => {
      const cancellationErrors = [
        { message: 'User cancelled OAuth' },
        { message: 'Access denied by user' },
        { error: 'access_denied' },
        { message: 'popup_closed' },
        { message: 'User denied access' },
      ]

      for (const error of cancellationErrors) {
        const result = await handleGoogleSignInError(error)
        expect(result).toBe('Sign-in was cancelled. Please try again.')
      }
    })

    it('should handle network and connection errors', async () => {
      const networkErrors = [
        { message: 'Network connection failed' },
        { message: 'Connection timeout' },
        { code: 'network_error' },
        { message: 'Unable to connect to server' },
      ]

      for (const error of networkErrors) {
        const result = await handleGoogleSignInError(error)
        expect(result).toBe('Unable to connect to Google. Please check your internet connection and try again.')
      }
    })

    it('should handle OAuth configuration errors', async () => {
      const configErrors = [
        { message: 'Invalid client_id' },
        { code: 'invalid_client' },
        { message: 'OAuth configuration error' },
        { error: 'invalid_client' },
      ]

      for (const error of configErrors) {
        const result = await handleGoogleSignInError(error)
        expect(result).toBe('Authentication service is temporarily unavailable. Please try again later.')
      }
    })

    it('should handle account conflict errors', async () => {
      const conflictErrors = [
        { message: 'Email already registered' },
        { code: 'email_already_exists' },
        { message: 'Account exists with different provider' },
      ]

      for (const error of conflictErrors) {
        const result = await handleGoogleSignInError(error)
        expect(result).toBe('This Google account is already associated with another user.')
      }
    })

    it('should handle OAuth-specific errors', async () => {
      const oauthErrors = [
        { code: 'invalid_request', message: 'Invalid OAuth request' },
        { code: 'unauthorized_client', message: 'Unauthorized client' },
        { code: 'invalid_scope', message: 'Invalid scope' },
      ]

      const expectedMessages = [
        'Invalid authentication request. Please try again.',
        'Authentication service error. Please try again later.',
        'Permission error. Please try again.',
      ]

      for (let i = 0; i < oauthErrors.length; i++) {
        const result = await handleGoogleSignInError(oauthErrors[i])
        expect(result).toBe(expectedMessages[i])
      }
    })

    it('should provide generic fallback for unknown errors', async () => {
      const unknownErrors = [
        { message: 'Unexpected error occurred' },
        { code: 'unknown_error' },
        { error: 'something_went_wrong' },
        {},
      ]

      for (const error of unknownErrors) {
        const result = await handleGoogleSignInError(error)
        expect(result).toBe('An error occurred during sign-in. Please try again or use email/password instead.')
      }
    })
  })

  describe('OAuth Flow Error Recovery', () => {
    it('should handle OAuth initiation failures', async () => {
      const initError = { message: 'Failed to initiate OAuth' }
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: initError,
      })

      const { data, error } = await signInWithGoogle()

      expect(data).toBeNull()
      expect(error).toEqual(initError)
    })

    it('should handle callback processing failures', async () => {
      const callbackError = { message: 'Failed to process callback' }
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: callbackError,
      })

      const { session, error } = await handleOAuthCallback()

      expect(session).toBeNull()
      expect(error).toEqual(callbackError)
    })

    it('should handle profile sync failures gracefully', async () => {
      const syncError = new Error('Profile sync failed')
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(syncError),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      }

      const { data, error } = await syncGoogleProfile(mockUser)

      expect(data).toBeNull()
      expect(error).toEqual(syncError)
    })
  })

  describe('Fallback Mechanisms', () => {
    it('should maintain email/password auth availability during OAuth errors', async () => {
      // Mock OAuth failure
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth service unavailable' },
      })

      // Mock successful email/password auth
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'test-user', email: 'test@example.com' },
          session: { access_token: 'token' },
        },
        error: null,
      })

      // OAuth should fail
      const oauthResult = await signInWithGoogle()
      expect(oauthResult.error).toBeDefined()

      // Email/password should still work
      const { signIn } = await import('@/lib/supabase/auth')
      const emailResult = await signIn('test@example.com', 'password')
      expect(emailResult.data.user).toBeDefined()
      expect(emailResult.error).toBeNull()
    })

    it('should handle partial OAuth success with profile sync failure', async () => {
      const googleUser = {
        id: 'test-user',
        email: 'test@example.com',
        app_metadata: { provider: 'google' },
        user_metadata: {
          full_name: 'Test User',
        },
      }

      // Mock successful session but failed profile sync
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: googleUser, access_token: 'token' } },
        error: null,
      })

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error('Profile sync failed')),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { session, error } = await handleOAuthCallback()

      // Should still return session even if profile sync fails
      expect(session).toBeDefined()
      expect(session?.user).toEqual(googleUser)
      expect(error).toBeNull()
    })

    it('should handle demo mode fallbacks', async () => {
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

  describe('Error Logging and Debugging', () => {
    it('should log unhandled errors for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const unknownError = {
        message: 'Very specific unknown error',
        code: 'unknown_specific_code',
        details: 'Additional error details',
      }

      await handleGoogleSignInError(unknownError)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unhandled Google sign-in error:',
        expect.objectContaining({
          error: unknownError,
          errorMessage: 'Very specific unknown error',
          errorCode: 'unknown_specific_code',
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle callback errors with proper logging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const callbackError = new Error('Callback processing failed')
      mockSupabaseClient.auth.getSession.mockRejectedValue(callbackError)

      const { session, error } = await handleOAuthCallback()

      expect(consoleSpy).toHaveBeenCalledWith('OAuth callback error:', callbackError)
      expect(session).toBeNull()
      expect(error).toEqual(callbackError)

      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined error objects', async () => {
      const results = await Promise.all([
        handleGoogleSignInError(null),
        handleGoogleSignInError(undefined),
        handleGoogleSignInError(''),
        handleGoogleSignInError(0),
        handleGoogleSignInError(false),
      ])

      results.forEach(result => {
        expect(result).toBe('An unknown error occurred')
      })
    })

    it('should handle malformed error objects', async () => {
      const malformedErrors = [
        { message: null, code: undefined },
        { error_description: 'Description without error code' },
        { random_field: 'Not a standard error field' },
        'String error instead of object',
        123,
      ]

      for (const error of malformedErrors) {
        const result = await handleGoogleSignInError(error)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    })

    it('should handle session without user in callback', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token', user: null } },
        error: null,
      })

      const { session, error } = await handleOAuthCallback()

      expect(session?.user).toBeNull()
      expect(error).toBeNull()
    })

    it('should handle empty user metadata in profile sync', async () => {
      const userWithoutMetadata = {
        id: 'test-user',
        email: 'test@example.com',
        user_metadata: {},
      }

      const { data, error } = await syncGoogleProfile(userWithoutMetadata)

      // Should not fail, just return existing profile or create minimal one
      expect(error).toBeNull()
    })
  })
})