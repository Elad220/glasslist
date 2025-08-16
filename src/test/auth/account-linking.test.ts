import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  handleProfileConflict,
  syncGoogleProfile,
} from '@/lib/supabase/auth'
import { mockSupabaseClient, mockUser, mockProfile, resetMocks } from '../mocks/supabase'

describe('Account Linking Functionality', () => {
  beforeEach(() => {
    resetMocks()
  })

  describe('Profile Conflict Detection', () => {
    it('should allow linking when no email conflicts exist', async () => {
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

      const { canLink, error } = await handleProfileConflict('new@example.com', 'user-123')

      expect(canLink).toBe(true)
      expect(error).toBeNull()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should prevent linking when email already exists for different user', async () => {
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockResolvedValue({
              data: [
                { id: 'existing-user-456', email: 'conflict@example.com' }
              ],
              error: null,
            }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { canLink, error } = await handleProfileConflict('conflict@example.com', 'user-123')

      expect(canLink).toBe(false)
      expect(error).toBe('This Google account is already associated with another user account.')
    })

    it('should handle database errors during conflict check', async () => {
      const dbError = { message: 'Database connection failed' }
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockResolvedValue({
              data: null,
              error: dbError,
            }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { canLink, error } = await handleProfileConflict('test@example.com', 'user-123')

      expect(canLink).toBe(false)
      expect(error).toBe('Failed to check for existing accounts')
    })

    it('should handle network errors during conflict check', async () => {
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn().mockRejectedValue(new Error('Network error')),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { canLink, error } = await handleProfileConflict('test@example.com', 'user-123')

      expect(canLink).toBe(false)
      expect(error).toBe('Failed to verify account linking')
    })
  })

  describe('Profile Data Merging', () => {
    it('should merge Google profile data with existing profile', async () => {
      const existingProfile = {
        ...mockProfile,
        full_name: 'Existing Name',
        avatar_url: null,
        email: 'old@example.com',
      }

      const googleUser = {
        ...mockUser,
        user_metadata: {
          full_name: 'Google Name',
          avatar_url: 'https://google.com/avatar.jpg',
          email: 'new@example.com',
        },
      }

      // Mock existing profile fetch
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
                data: {
                  ...existingProfile,
                  email: 'new@example.com',
                  avatar_url: 'https://google.com/avatar.jpg',
                },
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(googleUser)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should prioritize existing data when Google data is empty', async () => {
      const existingProfile = {
        ...mockProfile,
        full_name: 'Existing Name',
        avatar_url: 'https://existing.com/avatar.jpg',
      }

      const googleUserWithEmptyData = {
        ...mockUser,
        user_metadata: {
          email: 'test@example.com',
          // No full_name or avatar_url
        },
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
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(googleUserWithEmptyData)

      expect(error).toBeNull()
      expect(data).toEqual(existingProfile)
    })

    it('should handle profile creation for new Google users', async () => {
      const newGoogleUser = {
        ...mockUser,
        id: 'new-google-user',
        user_metadata: {
          full_name: 'New Google User',
          avatar_url: 'https://google.com/new-avatar.jpg',
          email: 'newuser@example.com',
        },
      }

      // Mock no existing profile (new user)
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'new-google-user',
                  email: 'newuser@example.com',
                  full_name: 'New Google User',
                  avatar_url: 'https://google.com/new-avatar.jpg',
                },
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(newGoogleUser)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Data Priority Rules', () => {
    it('should update empty fields with Google data', async () => {
      const profileWithEmptyFields = {
        ...mockProfile,
        full_name: null,
        avatar_url: null,
      }

      const googleUser = {
        ...mockUser,
        user_metadata: {
          full_name: 'Google Full Name',
          avatar_url: 'https://google.com/avatar.jpg',
          email: 'test@example.com',
        },
      }

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: profileWithEmptyFields,
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...profileWithEmptyFields,
                  full_name: 'Google Full Name',
                  avatar_url: 'https://google.com/avatar.jpg',
                },
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(googleUser)

      expect(error).toBeNull()
      expect(data?.full_name).toBe('Google Full Name')
      expect(data?.avatar_url).toBe('https://google.com/avatar.jpg')
    })

    it('should preserve existing data when Google data is not better', async () => {
      const profileWithData = {
        ...mockProfile,
        full_name: 'Existing Full Name',
        avatar_url: 'https://existing.com/avatar.jpg',
      }

      const googleUser = {
        ...mockUser,
        user_metadata: {
          full_name: 'Google Name',
          avatar_url: 'https://google.com/avatar.jpg',
          email: 'test@example.com',
        },
      }

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: profileWithData,
              error: null,
            }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(googleUser)

      // Should not update since existing data exists
      expect(error).toBeNull()
      expect(data).toEqual(profileWithData)
    })

    it('should always update email from Google', async () => {
      const profileWithOldEmail = {
        ...mockProfile,
        email: 'old@example.com',
      }

      const googleUser = {
        ...mockUser,
        email: 'new@example.com',
        user_metadata: {
          email: 'new@example.com',
        },
      }

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: profileWithOldEmail,
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...profileWithOldEmail,
                  email: 'new@example.com',
                },
                error: null,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(googleUser)

      expect(error).toBeNull()
      expect(data?.email).toBe('new@example.com')
    })
  })

  describe('Error Scenarios in Account Linking', () => {
    it('should handle profile update failures during linking', async () => {
      const updateError = { message: 'Profile update failed' }
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: updateError,
              }),
            })),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      const { data, error } = await syncGoogleProfile(mockUser)

      expect(data).toBeNull()
      expect(error).toEqual(updateError)
    })

    it('should handle concurrent linking attempts', async () => {
      // Simulate race condition where two users try to link the same Google account
      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn()
              .mockResolvedValueOnce({
                data: [], // First check: no conflict
                error: null,
              })
              .mockResolvedValueOnce({
                data: [{ id: 'other-user', email: 'test@example.com' }], // Second check: conflict appeared
                error: null,
              }),
          })),
        })),
      }
      
      mockSupabaseClient.from.mockReturnValue(mockFromChain)

      // First attempt should succeed
      const result1 = await handleProfileConflict('test@example.com', 'user-1')
      expect(result1.canLink).toBe(true)

      // Second attempt should fail
      const result2 = await handleProfileConflict('test@example.com', 'user-2')
      expect(result2.canLink).toBe(false)
    })
  })
})