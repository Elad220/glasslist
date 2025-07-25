'use client'

import { useEffect } from 'react'
import { OfflineIndicator, OfflineBanner } from './OfflineIndicator'
import { InstallPrompt } from './InstallPrompt'
import { registerServiceWorker } from '@/lib/offline/sw-register'
import { useOfflineCapability } from '@/lib/offline/hooks'

interface OfflineProviderProps {
  children: React.ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const isOfflineSupported = useOfflineCapability()

  useEffect(() => {
    // Register service worker
    registerServiceWorker()
      .then((registration) => {
        if (registration) {
          console.log('Service Worker registered successfully')
        }
      })
      .catch((error) => {
        console.error('Failed to register Service Worker:', error)
      })
  }, [])

  return (
    <>
      {children}
      
      {/* Show offline indicators only if offline capability is supported */}
      {isOfflineSupported && (
        <>
          <OfflineBanner />
          <OfflineIndicator />
        </>
      )}
      
      {/* Install prompt */}
      <InstallPrompt />
    </>
  )
}