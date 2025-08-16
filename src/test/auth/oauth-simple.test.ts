import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  handleGoogleSignInError,
  isOAuthCallback,
} from '@/lib/supabase/auth'

// Mock window for isOAuthCallback tests
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

describe('OAuth Utility Functions', () => {
  beforeEach(() => {
    mockLocation.search = ''
    mockLocation.href = 'http://localhost:3000'
  })

  describe('handleGoogleSignInError', () => {
    it('should handle user cancellation errors', async () => {
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

    it('should handle configuration errors', async () => {
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