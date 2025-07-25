// Simple test utilities for offline functionality
import { syncService } from './sync'
import { offlineDB } from './db'

export async function testOfflineFunctionality() {
  console.log('🧪 Testing Offline Functionality...')
  
  try {
    // Test 1: Check if IndexedDB is accessible
    await offlineDB.init()
    console.log('✅ IndexedDB initialized successfully')
    
    // Test 2: Test creating a list offline
    const testList = {
      user_id: 'test-user',
      name: 'Test Shopping List',
      description: 'Test list for offline functionality',
      color: '#667eea',
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const listId = await syncService.createListOffline(testList)
    console.log('✅ Created test list offline:', listId)
    
    // Test 3: Test creating an item offline
    const testItem = {
      list_id: listId,
      name: 'Test Item',
      amount: 1,
      unit: 'piece',
      category: 'Test',
      notes: 'Test item for offline functionality',
      image_url: null,
      is_checked: false,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const itemId = await syncService.createItemOffline(testItem)
    console.log('✅ Created test item offline:', itemId)
    
    // Test 4: Test retrieving offline data
    const offlineList = await syncService.getListOffline(listId)
    const offlineItems = await syncService.getItemsOffline(listId)
    
    console.log('✅ Retrieved offline list:', offlineList?.name)
    console.log('✅ Retrieved offline items:', offlineItems.length)
    
    // Test 5: Test updating item offline
    await syncService.updateItemOffline(itemId, { is_checked: true })
    console.log('✅ Updated item offline')
    
    // Test 6: Check pending changes
    const status = syncService.getStatus()
    console.log('✅ Sync status:', {
      isOnline: status.isOnline,
      pendingChanges: status.pendingChanges,
      isSyncing: status.isSyncing
    })
    
    // Clean up test data
    await syncService.deleteItemOffline(itemId)
    await syncService.deleteListOffline(listId)
    console.log('✅ Cleaned up test data')
    
    console.log('🎉 All offline functionality tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Offline functionality test failed:', error)
    return false
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testOfflineFunctionality = testOfflineFunctionality
}