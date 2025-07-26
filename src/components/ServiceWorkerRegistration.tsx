'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })

          console.log('ServiceWorker registered successfully:', registration.scope)

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, notify user
                  console.log('New content available! Please refresh.')
                  
                  // You could show a toast notification here
                  if (window.confirm('New version available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })

          // Listen for messages from the service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message from SW:', event.data)
            
            if (event.data.type === 'BACKGROUND_SYNC') {
              // Handle background sync events
              console.log('Background sync triggered')
            }
            
            if (event.data.type === 'FORCE_SYNC') {
              // Force sync when requested by SW
              console.log('Force sync requested by SW')
            }
          })

          // Check if there's a waiting service worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }

        } catch (error) {
          console.error('ServiceWorker registration failed:', error)
        }
      }

      registerSW()
    }
  }, [])

  return null // This component doesn't render anything
}

// Helper function to check if app is running standalone (PWA)
export function useIsStandalone() {
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')

    if (isStandalone) {
      console.log('App is running in standalone mode (PWA)')
      document.body.classList.add('standalone')
    }
  }, [])
}

// Helper to check if app can be installed
export function useInstallPrompt() {
  useEffect(() => {
    let deferredPrompt: any = null

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Stash the event so it can be triggered later
      deferredPrompt = e
      
      console.log('PWA install prompt available')
      
      // You could show your own install button here
      // showInstallButton()
    }

    const handleAppInstalled = () => {
      console.log('PWA was installed')
      deferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
} 