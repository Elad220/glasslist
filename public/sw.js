// GlassList Service Worker
// Provides basic caching and offline support

const CACHE_NAME = 'glasslist-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/auth',
  '/offline',
  '/_next/static/css/app/globals.css',
  // Add other critical static assets
]

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching critical resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error)
      })
  )
  
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control immediately
  return self.clients.claim()
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }
  
  // Skip Supabase API requests (let offline client handle these)
  if (url.hostname.includes('supabase')) {
    return
  }
  
  // Handle page requests with network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              
              // If no cached page, return offline page
              return caches.match('/offline')
                .then((offlinePage) => {
                  return offlinePage || new Response(
                    '<!DOCTYPE html><html><head><title>GlassList - Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  )
                })
            })
        })
    )
    return
  }
  
  // Handle static assets with cache-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.url.includes('/_next/static/')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone)
                  })
              }
              return response
            })
        })
    )
    return
  }
  
  // For API requests, let them pass through normally
  // The offline client will handle Supabase requests
})

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        event.ports[0].postMessage({ success: true })
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache URLs', error)
        event.ports[0].postMessage({ success: false, error: error.message })
      })
  }
})

// Background sync (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync event', event.tag)
    
    if (event.tag === 'background-sync') {
      event.waitUntil(
        // Notify the app that background sync is available
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'BACKGROUND_SYNC',
              tag: event.tag
            })
          })
        })
      )
    }
  })
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event', event)
  
  const options = {
    body: 'You have pending shopping list changes to sync!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'sync-reminder',
    actions: [
      {
        action: 'sync-now',
        title: 'Sync Now'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('GlassList Sync', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click', event)
  
  event.notification.close()
  
  if (event.action === 'sync-now') {
    // Open the app and trigger sync
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].focus()
          clients[0].postMessage({ type: 'FORCE_SYNC' })
        } else {
          self.clients.openWindow('/dashboard')
        }
      })
    )
  }
})

console.log('Service Worker: Loaded successfully') 