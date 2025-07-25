// Simple test utilities for offline functionality
import { syncService } from './sync'
import { offlineDB } from './db'

export async function testOfflineFunctionality() {
  console.log('🧪 Testing Offline Functionality...')
  
  try {
    // Test 1: Check if IndexedDB is accessible
    console.log('1. Testing IndexedDB access...')
    await offlineDB.init()
    console.log('✅ IndexedDB initialized successfully')
    
    // Test 2: Test offline list creation
    console.log('2. Testing offline list creation...')
    const testListId = await syncService.createListOffline({
      user_id: 'test-user',
      name: 'Test Offline List',
      description: 'Testing offline functionality',
      color: '#667eea',
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    console.log('✅ Offline list created with ID:', testListId)
    
    // Test 3: Test offline item creation
    console.log('3. Testing offline item creation...')
    const testItemId = await syncService.createItemOffline({
      list_id: testListId,
      name: 'Test Item',
      amount: 1,
      unit: 'piece',
      category: 'Test',
      notes: 'Testing offline item creation',
      image_url: null,
      is_checked: false,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    console.log('✅ Offline item created with ID:', testItemId)
    
    // Test 4: Test retrieving offline data
    console.log('4. Testing offline data retrieval...')
    const offlineList = await syncService.getListOffline(testListId)
    const offlineItems = await syncService.getItemsOffline(testListId)
    console.log('✅ Retrieved offline list:', offlineList?.name)
    console.log('✅ Retrieved offline items count:', offlineItems.length)
    
    // Test 5: Test sync status
    console.log('5. Testing sync status...')
    const status = syncService.getStatus()
    console.log('✅ Sync status:', {
      isOnline: status.isOnline,
      pendingChanges: status.pendingChanges,
      isSyncing: status.isSyncing
    })
    
    // Test 6: Clean up test data
    console.log('6. Cleaning up test data...')
    await syncService.deleteListOffline(testListId)
    console.log('✅ Test data cleaned up')
    
    console.log('🎉 All offline functionality tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Offline functionality test failed:', error)
    return false
  }
}

export async function testServiceWorker() {
  console.log('🧪 Testing Service Worker...')
  
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker not supported in this browser')
      return false
    }
    
    // Check if service worker is registered
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      console.log('✅ Service Worker is registered')
      console.log('✅ Service Worker state:', registration.active?.state)
      return true
    } else {
      console.log('❌ Service Worker not registered')
      return false
    }
    
  } catch (error) {
    console.error('❌ Service Worker test failed:', error)
    return false
  }
}

// Export test functions for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testOfflineFunctionality = testOfflineFunctionality
  (window as any).testServiceWorker = testServiceWorker
}