const CACHE_NAME = 'glasslist-v1'
const STATIC_CACHE = 'glasslist-static-v1'
const DYNAMIC_CACHE = 'glasslist-dynamic-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/list/new',
  '/offline.html'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Static files cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests (except for images and fonts)
  if (!url.origin.includes(self.location.origin) && 
      !request.url.includes('.png') && 
      !request.url.includes('.jpg') && 
      !request.url.includes('.jpeg') && 
      !request.url.includes('.gif') && 
      !request.url.includes('.svg') && 
      !request.url.includes('.woff') && 
      !request.url.includes('.woff2') && 
      !request.url.includes('.ttf')) {
    return
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached response if available
        if (response) {
          return response
        }

        // Try to fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses for dynamic content
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone()
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone)
                })
            }
            return networkResponse
          })
          .catch(() => {
            // If network fails, try to serve offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html')
            }
            
            // For other requests, return a simple offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: {
                'Content-Type': 'text/plain'
              }
            })
          })
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // This will be handled by the sync service in the main thread
      console.log('Background sync triggered')
    )
  }
})

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New shopping list update',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View List',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('GlassList', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})