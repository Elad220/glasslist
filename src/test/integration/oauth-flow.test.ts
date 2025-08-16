import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import AuthPage from '@/app/auth/page'
import AuthCallbackPage from '@/app/auth/callback/page'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { mockSupabaseClient, resetMocks } from '../mocks/supabase'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

describe('OAuth Integration Flow', () => {
  beforeEach(() => {
    resetMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    mockPush.mockClear()
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        search: '',
        pathname: '/',
      },
      writable: true,
    })
  })

  describe('Complete OAuth Flow', () => {
    it('should complete full OAuth flow from auth page to callback', async () => {
      const user = userEvent.setup()

      // Step 1: Render auth page
      render(<AuthPage />)
      
      // Step 2: Find and click Google sign-in button
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      expect(googleButton).toBeInTheDocument()
      
      // Step 3: Click Google sign-in button
      await user.click(googleButton)
      
      // Step 4: Verify OAuth initiation
      await waitFor(() => {
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
      })
    })

    it('should handle successful OAuth callback', async () => {
      // Mock successful session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: {
              id: 'test-user',
              email: 'test@example.com',
              app_metadata: { provider: 'google' },
              user_metadata: {
                full_name: 'Test User',
                avatar_url: 'https://example.com/avatar.jpg',
              },
            },
          },
        },
        error: null,
      })

      render(<AuthCallbackPage />)

      // Should show loading state initially
      expect(screen.getByText(/completing sign in/i)).toBeInTheDocument()

      // Should show success state after processing
      await waitFor(() => {
        expect(screen.getByText(/welcome to glasslist/i)).toBeInTheDocument()
      })

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 3000 })
    })

    it('should handle OAuth callback errors', async () => {
      // Mock error in session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'OAuth error' },
      })

      render(<AuthCallbackPage />)

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/sign in failed/i)).toBeInTheDocument()
      })

      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should handle URL-based OAuth errors', async () => {
      // Mock URL with error parameters
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20cancelled',
          search: '?error=access_denied&error_description=User%20cancelled',
        },
        writable: true,
      })

      // Mock URLSearchParams
      global.URLSearchParams = class URLSearchParams {
        private params: Record<string, string>
        
        constructor(search: string) {
          this.params = {
            error: 'access_denied',
            error_description: 'User cancelled',
          }
        }
        
        get(key: string) {
          return this.params[key] || null
        }
      } as any

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/sign in failed/i)).toBeInTheDocument()
        expect(screen.getByText(/sign-in was cancelled/i)).toBeInTheDocument()
      })
    })
  })

  describe('Profile Synchronization Flow', () => {
    it('should sync Google profile data after successful OAuth', async () => {
      const googleUser = {
        id: 'test-user',
        email: 'test@example.com',
        app_metadata: { provider: 'google' },
        user_metadata: {
          full_name: 'Google User',
          name: 'Google User',
          avatar_url: 'https://lh3.googleusercontent.com/avatar',
          picture: 'https://lh3.googleusercontent.com/avatar',
          email_verified: true,
        },
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: googleUser,
          },
        },
        error: null,
      })

      // Mock profile update
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-user',
                email: 'old@example.com',
                full_name: null,
                avatar_url: null,
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'test-user',
                  email: 'test@example.com',
                  full_name: 'Google User',
                  avatar_url: 'https://lh3.googleusercontent.com/avatar',
                },
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/welcome to glasslist/i)).toBeInTheDocument()
      })

      // Verify profile sync was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle profile sync errors gracefully', async () => {
      const googleUser = {
        id: 'test-user',
        email: 'test@example.com',
        app_metadata: { provider: 'google' },
        user_metadata: {
          full_name: 'Google User',
        },
      }

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: googleUser,
          },
        },
        error: null,
      })

      // Mock profile sync error
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error('Profile sync failed')),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      render(<AuthCallbackPage />)

      // Should still show success even if profile sync fails
      await waitFor(() => {
        expect(screen.getByText(/welcome to glasslist/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Scenarios and Fallbacks', () => {
    it('should show appropriate error for network failures', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockSupabaseClient.auth.signInWithOAuth.mockRejectedValue(
        new Error('Network connection failed')
      )

      render(<AuthPage />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
      })
    })

    it('should provide fallback to email/password authentication', async () => {
      const user = userEvent.setup()
      
      // Mock OAuth error
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth configuration error' },
      })

      render(<AuthPage />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)

      await waitFor(() => {
        expect(screen.getByText(/authentication service is temporarily unavailable/i)).toBeInTheDocument()
      })

      // Email/password form should still be available
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should handle demo mode OAuth flow', async () => {
      const user = userEvent.setup()
      
      // Mock demo mode
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'

      render(<AuthPage />)
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i })
      await user.click(googleButton)

      await waitFor(() => {
        expect(screen.getByText(/demo mode: google sign-in successful/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 2000 })

      // Reset demo mode
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
    })
  })

  describe('Account Linking Scenarios', () => {
    it('should handle account linking conflicts', async () => {
      // Mock existing user with same email
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockResolvedValue({
              data: [{ id: 'existing-user', email: 'test@example.com' }],
              error: null,
            }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      // This would be tested in the account linking functionality
      // For now, we verify the conflict detection works
      const { handleProfileConflict } = await import('@/lib/supabase/auth')
      const { canLink, error } = await handleProfileConflict('test@example.com', 'new-user')

      expect(canLink).toBe(false)
      expect(error).toBe('This Google account is already associated with another user account.')
    })
  })
})