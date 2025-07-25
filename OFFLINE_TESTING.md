# 🧪 Offline Functionality Testing Guide

## Quick Test Commands

Open your browser's developer console and run these commands to test the offline functionality:

### 1. Test Basic Offline Operations
```javascript
testOfflineFunctionality()
```
This will test:
- IndexedDB initialization
- Creating lists offline
- Creating items offline
- Retrieving offline data
- Updating items offline
- Checking sync status
- Cleaning up test data

### 2. Test Sync Service
```javascript
testSyncService()
```
This will test:
- Online/offline detection
- Status subscription
- Sync service initialization

## Manual Testing Steps

### 1. Test Offline Mode
1. Open the app in your browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Check "Offline" checkbox to simulate offline mode
5. Try to:
   - View your shopping lists
   - Add new items
   - Edit existing items
   - Check/uncheck items
   - Create new lists

### 2. Test Sync Behavior
1. Make changes while offline
2. Uncheck "Offline" in Network tab
3. Watch for automatic sync
4. Check the sync indicators in the UI

### 3. Test PWA Installation
1. Look for the install prompt (usually appears after a few visits)
2. Click "Install" to add to home screen
3. Test the app from the installed version

### 4. Test Service Worker
1. Open Developer Tools
2. Go to Application tab
3. Check "Service Workers" section
4. Verify the service worker is registered and active

## Expected Behavior

### When Online:
- ✅ Green indicator showing "Online"
- ✅ Changes sync immediately
- ✅ No pending changes indicator

### When Offline:
- ✅ Orange indicator showing "Offline"
- ✅ Changes saved locally
- ✅ Pending changes counter increases
- ✅ "Sync Now" button appears when back online

### Sync Process:
- ✅ Automatic sync every 30 seconds when online
- ✅ Manual sync via "Sync Now" button
- ✅ Retry logic for failed syncs
- ✅ Conflict resolution for simultaneous edits

## Troubleshooting

### If IndexedDB fails:
- Check browser support (Chrome, Firefox, Safari, Edge)
- Clear browser data and try again
- Check for private/incognito mode restrictions

### If Service Worker fails:
- Check browser support
- Clear site data and reload
- Check for HTTPS requirement (required for service workers)

### If sync fails:
- Check network connectivity
- Check Supabase credentials
- Check browser console for errors

## Browser Support

- ✅ Chrome 40+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+

## Notes

- The app works best in modern browsers with full PWA support
- Some features may be limited in older browsers
- Private/incognito mode may restrict some offline features
- HTTPS is required for service workers in production