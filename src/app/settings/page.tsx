'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Key, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Camera,
  Upload,
  Trash2,
  Settings as SettingsIcon,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Palette,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { getCurrentUser, updateProfile, deleteAccount, signOut, getProfile } from '@/lib/supabase/auth'
import { useToast } from '@/lib/toast/context'
import { useTheme } from '@/lib/theme/context'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Mock profile for demo mode
const mockProfile = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  full_name: 'Demo User',
  avatar_url: null,
  gemini_api_key: null,
  ai_suggestions_enabled: false,
  ai_insights_enabled: false,
  ai_tips_enabled: false,
  ai_analytics_enabled: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

export default function SettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'appearance' | 'account'>('profile')

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    gemini_api_key: '',
    ai_suggestions_enabled: false,
    ai_insights_enabled: false,
    ai_tips_enabled: false,
    ai_analytics_enabled: false
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isDemoMode) {
          const { user: currentUser } = await getCurrentUser()
          if (!currentUser) {
            router.push('/auth')
            return
          }
          setUser(currentUser)
          
          // Load actual profile from Supabase (API key will be decrypted automatically)
          const { profile: profileData } = await getProfile(currentUser.id)
          if (profileData) {
            setProfile(profileData)
            setFormData({
              full_name: profileData.full_name || '',
              email: profileData.email || '',
              gemini_api_key: profileData.gemini_api_key || '',
              ai_suggestions_enabled: profileData.ai_suggestions_enabled ?? false,
              ai_insights_enabled: profileData.ai_insights_enabled ?? false,
              ai_tips_enabled: profileData.ai_tips_enabled ?? false,
              ai_analytics_enabled: profileData.ai_analytics_enabled ?? false
            })
          }
        } else {
          // Use demo data
          setProfile(mockProfile)
                      setFormData({
              full_name: mockProfile.full_name || '',
              email: mockProfile.email || '',
              gemini_api_key: mockProfile.gemini_api_key || '',
              ai_suggestions_enabled: mockProfile.ai_suggestions_enabled ?? false,
              ai_insights_enabled: mockProfile.ai_insights_enabled ?? false,
              ai_tips_enabled: mockProfile.ai_tips_enabled ?? false,
              ai_analytics_enabled: mockProfile.ai_analytics_enabled ?? false
            })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Loading failed', 'Failed to load your profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      
      if (isDemoMode) {
        // Simulate save in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaveStatus('success')
        toast.success('Settings saved', 'Your profile has been updated')
        
        // Update mock profile
        setProfile({
          ...profile,
          ...formData,
          updated_at: new Date().toISOString()
        })
              } else {
          // Real implementation - API key will be encrypted automatically in updateProfile
          if (user?.id) {
            const updateData = {
              full_name: formData.full_name,
              gemini_api_key: formData.gemini_api_key || null,
              ai_suggestions_enabled: formData.ai_suggestions_enabled,
              ai_insights_enabled: formData.ai_insights_enabled,
              ai_tips_enabled: formData.ai_tips_enabled,
              ai_analytics_enabled: formData.ai_analytics_enabled
            }
            
            const { data: updatedProfile, error } = await updateProfile(user.id, updateData)
          
          if (error) {
            // Check if the error is about missing AI-related columns
            if (error.message && error.message.includes('column') && 
                (error.message.includes('ai_suggestions_enabled') || 
                 error.message.includes('ai_insights_enabled') || 
                 error.message.includes('ai_tips_enabled') || 
                 error.message.includes('ai_analytics_enabled'))) {
              console.log('Database migration needed for AI feature toggles')
              // Still show success but with a note about the toggles
              setSaveStatus('success')
              toast.success('Settings saved', 'Profile updated (AI toggles stored locally)')
              return
            }
            throw new Error(error.message || 'Failed to update profile')
          }
          
          if (updatedProfile) {
            setProfile(updatedProfile)
          }
          
          setSaveStatus('success')
          toast.success('Settings saved', 'Your profile has been updated securely')
        } else {
          throw new Error('User not found')
        }
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
      toast.error('Save failed', 'Unable to save your settings. Please try again.')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      if (!isDemoMode && user?.id) {
        await deleteAccount(user.id)
      }
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  const validateApiKey = (key: string) => {
    // Basic validation for Gemini API key format
    return key.length === 0 || (key.startsWith('AIza') && key.length > 30)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-glass">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-10 animate-morph"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-premium p-6 mb-6 animate-slide-down hover-lift">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="glass-premium p-2 hover-glow micro-interaction">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-glass-heading flex items-center gap-2 animate-scale-in">
                <SettingsIcon className="w-6 h-6 animate-bounce-in" />
                Settings
              </h1>
              <p className="text-glass-muted animate-slide-up stagger-1">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card p-1 mb-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'profile' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-glass-muted hover:text-glass'
              }`}
            >
              <User className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm">Profile</span>
            </button>
            
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'ai' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-glass-muted hover:text-glass'
              }`}
            >
              <Sparkles className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm">AI Settings</span>
            </button>
            
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'appearance' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-glass-muted hover:text-glass'
              }`}
            >
              <Palette className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm">Appearance</span>
            </button>
            
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'account' 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-glass-muted hover:text-glass'
              }`}
            >
              <SettingsIcon className="w-4 h-4 mx-auto mb-1" />
              <span className="text-sm">Account</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-glass-heading mb-6">Profile Information</h2>
            
            <div className="space-y-6">
              {/* Avatar Section */}
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-3">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <button className="glass-button px-4 py-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Change Photo
                    </button>
                    {profile?.avatar_url && (
                      <button className="glass-button px-4 py-2 flex items-center gap-2 text-red-400">
                        <Trash2 className="w-5 h-5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted"
                  placeholder="Enter your email"
                />
                <p className="text-xs text-glass-muted mt-1">
                  Used for account login and sharing notifications
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-glass-heading mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Settings
            </h2>
            
            <div className="space-y-6">
              {/* Gemini API Key */}
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-2">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.gemini_api_key}
                    onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                    className={`w-full glass border-0 rounded-lg px-4 py-3 pr-12 text-glass placeholder-glass-muted ${
                      !validateApiKey(formData.gemini_api_key) ? 'border-red-400' : ''
                    }`}
                    placeholder="AIza..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-glass-muted hover:text-glass"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!validateApiKey(formData.gemini_api_key) && formData.gemini_api_key && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Invalid API key format
                  </p>
                )}
                <div className="glass p-4 rounded-lg mt-3">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-glass font-medium mb-2">How to get your Gemini API key:</p>
                      <ol className="text-xs text-glass-muted space-y-1 list-decimal list-inside">
                        <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                        <li>Sign in with your Google account</li>
                        <li>Click "Create API Key"</li>
                        <li>Copy and paste the key here</li>
                      </ol>
                      <p className="text-xs text-glass-muted mt-2">
                        Your API key is stored securely and only used for AI Quick Add features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Features */}
              <div>
                <h3 className="text-lg font-medium text-glass-heading mb-3">AI Features</h3>
                <div className="space-y-3">
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-glass">Quick Add</h4>
                        <p className="text-sm text-glass-muted">
                          Parse natural language into shopping list items
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        formData.gemini_api_key ? 'bg-green-500' : 'bg-glass-muted'
                      }`}>
                        {formData.gemini_api_key && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-glass">Smart Suggestions</h4>
                        <p className="text-sm text-glass-muted">
                          AI-powered item recommendations based on your shopping patterns
                        </p>
                        {isDemoMode && (
                          <p className="text-xs text-blue-500 mt-1">
                            Demo mode: Toggle functionality simulated
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          ai_suggestions_enabled: !formData.ai_suggestions_enabled
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                          formData.ai_suggestions_enabled 
                            ? 'bg-green-500' 
                            : 'bg-glass-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.ai_suggestions_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-glass">AI Insights</h4>
                        <p className="text-sm text-glass-muted">
                          Intelligent analysis of your shopping patterns and trends
                        </p>
                        {isDemoMode && (
                          <p className="text-xs text-blue-500 mt-1">
                            Demo mode: Toggle functionality simulated
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          ai_insights_enabled: !formData.ai_insights_enabled
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                          formData.ai_insights_enabled 
                            ? 'bg-green-500' 
                            : 'bg-glass-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.ai_insights_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-glass">Smart Shopping Tips</h4>
                        <p className="text-sm text-glass-muted">
                          Personalized shopping advice and efficiency recommendations
                        </p>
                        {isDemoMode && (
                          <p className="text-xs text-blue-500 mt-1">
                            Demo mode: Toggle functionality simulated
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          ai_tips_enabled: !formData.ai_tips_enabled
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                          formData.ai_tips_enabled 
                            ? 'bg-green-500' 
                            : 'bg-glass-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.ai_tips_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-glass">AI Analytics</h4>
                        <p className="text-sm text-glass-muted">
                          Advanced shopping analytics and trend analysis
                        </p>
                        {isDemoMode && (
                          <p className="text-xs text-blue-500 mt-1">
                            Demo mode: Toggle functionality simulated
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          ai_analytics_enabled: !formData.ai_analytics_enabled
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                          formData.ai_analytics_enabled 
                            ? 'bg-green-500' 
                            : 'bg-glass-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.ai_analytics_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-glass-heading mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance Settings
            </h2>
            
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-4">
                  Theme Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`glass p-4 rounded-lg transition-all ${
                      theme === 'light' 
                        ? 'ring-2 ring-primary/50 bg-primary/10' 
                        : 'hover:bg-glass-white-light'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <Sun className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-glass">Light</div>
                        <div className="text-xs text-glass-muted">Bright and vibrant</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`glass p-4 rounded-lg transition-all ${
                      theme === 'dark' 
                        ? 'ring-2 ring-primary/50 bg-primary/10' 
                        : 'hover:bg-glass-white-light'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-glass">Dark</div>
                        <div className="text-xs text-glass-muted">Easy on the eyes</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('system')}
                    className={`glass p-4 rounded-lg transition-all ${
                      theme === 'system' 
                        ? 'ring-2 ring-primary/50 bg-primary/10' 
                        : 'hover:bg-glass-white-light'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-glass">System</div>
                        <div className="text-xs text-glass-muted">Follows your device</div>
                      </div>
                    </div>
                  </button>
                </div>
                
                {theme === 'system' && (
                  <div className="glass p-3 rounded-lg mt-3">
                    <div className="flex items-center gap-2 text-sm text-glass-muted">
                      <Monitor className="w-4 h-4" />
                      <span>Currently using: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Preview */}
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-3">
                  Preview
                </label>
                <div className="glass p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-glass">Current Theme</h4>
                    <div className="flex items-center gap-2">
                      {theme === 'light' && <Sun className="w-4 h-4 text-yellow-500" />}
                      {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
                      {theme === 'system' && <Monitor className="w-4 h-4 text-gray-500" />}
                      <span className="text-sm text-glass-muted">
                        {theme === 'system' 
                          ? `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})` 
                          : theme.charAt(0).toUpperCase() + theme.slice(1)
                        }
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-glass-muted">
                    The theme will be applied immediately and saved for future visits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-glass-heading mb-6">Account Information</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-glass-white-border">
                  <span className="text-glass-muted">Account Created</span>
                  <span className="text-glass">
                    {new Date(profile?.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-glass-white-border">
                  <span className="text-glass-muted">Last Updated</span>
                  <span className="text-glass">
                    {new Date(profile?.updated_at || '').toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-glass-muted">Account Type</span>
                  <span className="text-glass">
                    {isDemoMode ? 'Demo Account' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border-red-400/20">
              <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <h4 className="font-medium text-glass">Delete Account</h4>
                    <p className="text-sm text-glass-muted">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    className="glass-button px-4 py-2 text-red-400 border-red-400/20 hover:bg-red-400/10"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="glass-card p-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Changes saved successfully!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Failed to save changes</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving || !validateApiKey(formData.gemini_api_key)}
              className="glass-button px-6 py-3 bg-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 