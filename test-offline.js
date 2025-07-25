// Simple test script to verify offline functionality
// Run this in the browser console or as a Node.js script

console.log('🧪 Testing Offline Functionality...')

// Test IndexedDB availability
if (typeof window !== 'undefined' && 'indexedDB' in window) {
  console.log('✅ IndexedDB is available')
} else {
  console.log('❌ IndexedDB is not available')
}

// Test Service Worker availability
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  console.log('✅ Service Worker is available')
} else {
  console.log('❌ Service Worker is not available')
}

// Test PWA features
if (typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window) {
  console.log('✅ PWA install prompt is supported')
} else {
  console.log('❌ PWA install prompt is not supported')
}

// Test offline detection
if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
  console.log(`✅ Online status detection: ${navigator.onLine ? 'Online' : 'Offline'}`)
} else {
  console.log('❌ Online status detection not available')
}

console.log('🎉 Offline functionality test completed!')
console.log('📱 Open the app in your browser and test:')
console.log('   1. Go offline (disconnect internet)')
console.log('   2. Try to add/edit items in a list')
console.log('   3. Go back online and check if changes sync')
console.log('   4. Try installing the PWA')