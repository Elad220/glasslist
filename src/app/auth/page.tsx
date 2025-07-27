'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, ArrowRight } from 'lucide-react'
import { signIn, signUp } from '@/lib/supabase/auth'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      fullName: 'Demo User',
      confirmPassword: 'demo123'
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15 animate-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-20 animate-pulse-glow"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Back to home link */}
        <Link 
          href="/" 
          className="glass-premium mb-8 px-4 py-2 inline-flex items-center gap-2 text-sm hover-lift micro-interaction animate-slide-down"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <div className="glass-card bg-blue-100/10 border-blue-300/30 p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Demo Mode Active</p>
                <p className="text-sm">No Supabase configuration needed - try any credentials!</p>
                <button 
                  onClick={handleDemoLogin}
                  className="text-xs underline mt-1"
                >
                  Fill demo credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="glass-premium p-8 animate-slide-up stagger-1 hover-lift">
          {/* Header */}
          <div className="text-center mb-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-primary animate-bounce-in" />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-text-shimmer">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-text-secondary animate-slide-up stagger-2">
              {isLogin 
                ? 'Sign in to your GlassList account' 
                : 'Join GlassList and start organizing'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card bg-red-100/10 border-red-300/30 p-4 mb-6 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="glass-card bg-green-100/10 border-green-300/30 p-4 mb-6 text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name (Register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="glass-premium w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-text-secondary/50 focus-ring transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="glass w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-text-secondary/50"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="glass w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-text-secondary/50"
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="glass w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-text-secondary/50"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-premium py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover-glow micro-interaction animate-slide-up stagger-3 transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Please wait...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <button
              onClick={toggleMode}
              className="text-primary hover:text-primary-light transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 