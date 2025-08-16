'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, ArrowRight, Sparkles, Shield, CheckCircle } from 'lucide-react'
import { signIn, signUp, signInWithGoogle, handleGoogleSignInError } from '@/lib/supabase/auth'
import GoogleSignInButton from '@/components/GoogleSignInButton'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
    setSuccess('')
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return false
    }

    if (!isLogin) {
      if (!formData.fullName) {
        setError('Full name is required')
        return false
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        const { data, error } = await signIn(formData.email, formData.password)
        if (error) {
          setError(error.message)
        } else if (data.user) {
          setSuccess('Successfully signed in!')
          if (isDemoMode) {
            setSuccess('Demo mode: Sign in successful! Redirecting to dashboard...')
          }
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        }
      } else {
        const { data, error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) {
          setError(error.message)
        } else {
          if (isDemoMode) {
            setSuccess('Demo mode: Account created successfully!')
          } else {
            setSuccess('Please check your email for verification link!')
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: ''
    })
  }

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@glasslist.com',
      password: 'demo123',
      fullName: '',
      confirmPassword: ''
    })
    setIsLogin(true)
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        const friendlyError = await handleGoogleSignInError(error)
        setError(friendlyError)
      } else if (isDemoMode) {
        setSuccess('Demo mode: Google sign-in successful! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
      // For real OAuth, the redirect happens automatically
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError('An unexpected error occurred during Google sign-in')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 animate-page-load">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 glass-white rounded-full blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-8 animate-float floating-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] glass-white rounded-full blur-3xl opacity-5 animate-morph"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          {/* Back to Home Link */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-glass-muted hover:text-glass-heading transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          
          {/* Logo and Title Section */}
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <ShoppingCart className="w-16 h-16 mx-auto text-primary animate-bounce-in" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-glass-heading mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-glass-muted">
              {isLogin ? 'Sign in to continue to GlassList' : 'Join thousands of users'}
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="glass-premium p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field (Sign Up Only) */}
            {!isLogin && (
              <div className="animate-slide-up stagger-1">
                <label htmlFor="fullName" className="block text-sm font-medium text-glass-heading mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-glass-muted pointer-events-none" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full py-3 glass-input has-left-icon"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="animate-slide-up stagger-2">
              <label htmlFor="email" className="block text-sm font-medium text-glass-heading mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-glass-muted pointer-events-none" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full py-3 glass-input has-left-icon"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="animate-slide-up stagger-3">
              <label htmlFor="password" className="block text-sm font-medium text-glass-heading mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-glass-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full py-3 glass-input has-both-icons"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-glass-muted hover:text-glass-heading transition-colors p-1 rounded"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {!isLogin && (
              <div className="animate-slide-up stagger-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-glass-heading mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-glass-muted pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full py-3 glass-input has-both-icons"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-glass-muted hover:text-glass-heading transition-colors p-1 rounded"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="animate-slide-up stagger-5">
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="animate-slide-up stagger-5">
                <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-300 text-sm">{success}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="animate-slide-up stagger-6">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full glass-button py-3 text-lg font-semibold button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="animate-slide-up stagger-7">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-glass-white-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-glass-dark text-glass-muted">or</span>
                </div>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div className="animate-slide-up stagger-8">
              <GoogleSignInButton
                isLoading={isGoogleLoading}
                onSignIn={handleGoogleSignIn}
                disabled={isLoading}
              />
            </div>

            {/* Demo Login Button */}
            {isDemoMode && (
              <div className="animate-slide-up stagger-9">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full glass-button bg-glass-white-light py-3 text-lg font-semibold hover:bg-glass-white-border"
                >
                  Try Demo Account
                </button>
              </div>
            )}
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 pt-6 border-t border-glass-white-border animate-slide-up stagger-10">
            <p className="text-center text-glass-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 text-primary hover:text-primary-light font-medium transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center animate-slide-up stagger-11">
          <div className="glass-card p-6">
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-glass-muted">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-glass-muted">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm">Free</span>
              </div>
            </div>
            <p className="text-xs text-glass-muted">
              Your data is encrypted and secure. We never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 