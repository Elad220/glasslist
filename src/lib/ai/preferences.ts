import type { Profile } from '../supabase/types'

export interface AIPreferences {
  ai_quick_add_enabled: boolean
  ai_voice_enabled: boolean
  ai_auto_populate_enabled: boolean
  ai_suggestions_enabled: boolean
  ai_analytics_enabled: boolean
  ai_tips_enabled: boolean
  ai_insights_enabled: boolean
}

export function getAIPreferences(profile: Profile | null): AIPreferences {
  if (!profile) {
    return {
      ai_quick_add_enabled: false,
      ai_voice_enabled: false,
      ai_auto_populate_enabled: false,
      ai_suggestions_enabled: false,
      ai_analytics_enabled: false,
      ai_tips_enabled: false,
      ai_insights_enabled: false
    }
  }

  return {
    ai_quick_add_enabled: profile.ai_quick_add_enabled ?? true,
    ai_voice_enabled: profile.ai_voice_enabled ?? true,
    ai_auto_populate_enabled: profile.ai_auto_populate_enabled ?? false,
    ai_suggestions_enabled: profile.ai_suggestions_enabled ?? true,
    ai_analytics_enabled: profile.ai_analytics_enabled ?? true,
    ai_tips_enabled: profile.ai_tips_enabled ?? true,
    ai_insights_enabled: profile.ai_insights_enabled ?? true
  }
}

export function isAIFeatureEnabled(
  profile: Profile | null,
  feature: keyof AIPreferences
): boolean {
  if (!profile?.gemini_api_key) {
    return false
  }

  const preferences = getAIPreferences(profile)
  return preferences[feature]
}

export function requiresAPIKey(feature: keyof AIPreferences): boolean {
  return true // All AI features require an API key
}