'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react'
import { handleOAuthCallback, handleGoogleSignInError } from '@/lib/supabase/auth'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have OAuth parameters in the URL
        const urlParams = new URLSearchParams(window.location.search)
        const hasError = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        if (hasError) {
          console.error('OAuth URL error:', hasError, errorDescription)
          let friendlyError = 'Authentication failed.'
          
          if (hasError === 'access_denied') {
            friendlyError = 'Sign-in was cancelled. Please try again.'
          } else if (hasError === 'invalid_request') {
            friendlyError = 'Invalid authentication request. Please try again.'
          } else if (errorDescription) {
            friendlyError = errorDescription
          }
          
          setError(friendlyError)
          setStatus('error')
          return
        }

        const { session, error } = await handleOAuthCallback()
        
        if (error) {
          console.error('OAuth callback error:', error)
          const friendlyError = await handleGoogleSignInError(error)
          setError(friendlyError)
          setStatus('error')
          return
        }

        if (session?.user) {
          setStatus('success')
          // Redirect to dashboard after a brief success message
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setError('Authentication was not completed. Please try signing in again.')
          setStatus('error')
        }
      } catch (err) {
        console.error('Unexpected callback error:', err)
        setError('An unexpected error occurred. Please try again.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [router])

  const handleRetry = () => {
    router.push('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 glass-white rounded-full blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-8 animate-float floating-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] glass-white rounded-full blur-3xl opacity-5 animate-morph"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-premium p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <ShoppingCart className="w-16 h-16 mx-auto text-primary animate-bounce-in" />
          </div>

          {status === 'loading' && (
            <div className="animate-slide-up">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full spinner mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-glass-heading mb-2">
                Completing Sign In
              </h1>
              <p className="text-glass-muted">
                Please wait while we set up your account...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-slide-up">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h1 className="text-2xl font-bold text-glass-heading mb-2">
                Welcome to GlassList!
              </h1>
              <p className="text-glass-muted mb-4">
                Your Google account has been successfully linked.
              </p>
              <p className="text-sm text-glass-muted">
                Redirecting to your dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-slide-up">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h1 className="text-2xl font-bold text-glass-heading mb-2">
                Sign In Failed
              </h1>
              <p className="text-glass-muted mb-6">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="glass-button py-3 px-6 text-lg font-semibold button-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}