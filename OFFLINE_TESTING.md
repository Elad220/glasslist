# Offline Mode Testing Guide

## 🧪 Testing Offline Functionality

### Quick Test in Browser Console

1. **Open your browser's developer tools** (F12)
2. **Go to the Console tab**
3. **Run the offline functionality test:**
   ```javascript
   testOfflineFunctionality()
   ```
4. **Test the service worker:**
   ```javascript
   testServiceWorker()
   ```

### Manual Testing Steps

#### 1. Test Offline Mode Detection
1. Open the app in your browser
2. Open Developer Tools → Network tab
3. Check "Offline" checkbox to simulate offline mode
4. Verify the orange "Offline" indicator appears
5. Try navigating between pages - they should still work

#### 2. Test Offline Data Operations
1. Go offline (using Network tab)
2. Create a new shopping list
3. Add items to the list
4. Edit items (check/uncheck, change names)
5. Delete items
6. Verify all changes are saved locally
7. Check the pending changes counter increases

#### 3. Test Sync Functionality
1. Make changes while offline
2. Go back online (uncheck "Offline" in Network tab)
3. Wait for automatic sync (or click "Sync Now")
4. Verify changes appear in the database
5. Check pending changes counter decreases to 0

#### 4. Test PWA Installation
1. Look for the install prompt (blue banner)
2. Click "Install" to add to home screen
3. Verify the app works as a standalone app
4. Test offline functionality in the installed app

#### 5. Test Service Worker Caching
1. Load the app normally
2. Go offline
3. Refresh the page
4. Verify the app still loads (from cache)
5. Try accessing different pages

### Expected Behavior

#### Online Mode
- ✅ Green "Online" indicator
- ✅ Real-time sync with database
- ✅ No pending changes counter
- ✅ Install prompt available

#### Offline Mode
- ✅ Orange "Offline" indicator
- ✅ Pending changes counter increases with edits
- ✅ All operations work locally
- ✅ "Sync Now" button appears when online

#### Sync Process
- ✅ Automatic sync every 30 seconds when online
- ✅ Manual sync with "Sync Now" button
- ✅ Retry logic for failed syncs
- ✅ Conflict resolution for simultaneous edits

### Troubleshooting

#### If offline mode doesn't work:
1. Check browser console for errors
2. Verify IndexedDB is supported: `'indexedDB' in window`
3. Verify Service Worker is registered: `navigator.serviceWorker.getRegistration()`

#### If sync doesn't work:
1. Check network connectivity
2. Verify Supabase credentials
3. Check browser console for sync errors
4. Try manual sync with "Sync Now" button

#### If PWA doesn't install:
1. Verify HTTPS is enabled (required for PWA)
2. Check if app is already installed
3. Try refreshing the page
4. Check browser console for install errors

### Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (limited PWA support)
- ✅ Mobile browsers (full support)

### Performance Notes

- First load: ~2-3 seconds (cache population)
- Subsequent loads: ~500ms (from cache)
- Offline operations: ~50ms (local storage)
- Sync operations: ~1-2 seconds (network dependent)