export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service Worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available')
            // You could show a notification to the user here
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      console.log('Service Worker unregistered')
    }
  } catch (error) {
    console.error('Failed to unregister Service Worker:', error)
  }
}

// PWA installation prompt
export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      resolve(false)
      return
    }

    // Check if the browser supports installation
    if (!('BeforeInstallPromptEvent' in window)) {
      resolve(false)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      
      // Show custom install prompt
      const shouldInstall = window.confirm(
        'Install GlassList for a better experience? You can access it offline and it will work like a native app.'
      )
      
      if (shouldInstall) {
        // Trigger the install prompt
        const promptEvent = event as any
        promptEvent.prompt()
        
        promptEvent.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt')
            resolve(true)
          } else {
            console.log('User dismissed the install prompt')
            resolve(false)
          }
        })
      } else {
        resolve(false)
      }
      
      // Remove the event listener
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      resolve(false)
    }, 5000)
  })
}

// Check if app is installed
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Failed to request notification permission:', error)
    return false
  }
}