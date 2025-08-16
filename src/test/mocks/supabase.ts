import { vi } from 'vitest'

// Mock user data
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: {
    full_name: 'Test User',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    picture: 'https://example.com/avatar.jpg',
    email: 'test@example.com',
    email_verified: true,
    provider_id: 'google-123',
    sub: 'google-123',
  },
  aud: 'authenticated',
  role: 'authenticated',
}

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
}

export const mockProfile = {
  id: 'test-user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  gemini_api_key: null,
  ai_suggestions_enabled: false,
  ai_insights_enabled: false,
  ai_tips_enabled: false,
  ai_analytics_enabled: false,
  ai_auto_populate_enabled: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signInWithOAuth: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    admin: {
      deleteUser: vi.fn(),
    },
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        neq: vi.fn(() => ({
          // For profile conflict checks
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}

// Mock the supabase client module
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient,
  isDemoMode: false,
}))

// Mock the encryption utilities
vi.mock('@/lib/utils/encryption', () => ({
  ensureEncrypted: vi.fn((data) => ({ success: true, data })),
  ensureDecrypted: vi.fn((data) => ({ success: true, data })),
}))

export const resetMocks = () => {
  vi.clearAllMocks()
  
  // Reset default mock implementations
  mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
    data: { url: 'https://accounts.google.com/oauth/authorize?...' },
    error: null,
  })
  
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: mockSession },
    error: null,
  })
  
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  })
  
  const mockFromChain = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
        neq: vi.fn(() => ({
          // For profile conflict checks - return empty array by default
        })).mockResolvedValue({
          data: [],
          error: null,
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
}