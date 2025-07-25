'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { showInstallPrompt, isAppInstalled } from '@/lib/offline/sw-register'

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(isAppInstalled())
    
    // Show prompt after 5 seconds if not installed
    const timer = setTimeout(() => {
      if (!isAppInstalled()) {
        setShowPrompt(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleInstall = async () => {
    try {
      const installed = await showInstallPrompt()
      if (installed) {
        setIsInstalled(true)
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  if (isInstalled || !showPrompt) {
    return null
  }

  const wasDismissed = localStorage.getItem('installPromptDismissed')
  if (wasDismissed) {
    const dismissedTime = parseInt(wasDismissed)
    const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
    if (hoursSinceDismissed < 24) {
      return null
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="glass-card p-4 shadow-lg border-2 border-blue-200/50 bg-blue-50/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-700 mb-1">Install GlassList</h3>
            <p className="text-sm text-blue-600 mb-3">
              Install the app for a better experience with offline support and faster access.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-blue-400 hover:text-blue-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}