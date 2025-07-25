# 📱 Offline Mode & PWA Features

## Overview

GlassList now supports full offline functionality with automatic synchronization when you're back online. This makes it perfect for real-world shopping scenarios where connectivity can be spotty.

## 🚀 Key Features

### Offline Capabilities
- ✅ **View all shopping lists** - Even when offline
- ✅ **Add new items** - Changes saved locally
- ✅ **Edit existing items** - Updates stored offline
- ✅ **Check/uncheck items** - Status changes persist
- ✅ **Delete items** - Removals queued for sync
- ✅ **Create new lists** - Stored locally first
- ✅ **Search and filter** - Works with cached data
- ✅ **Shopping mode** - Full functionality offline

### PWA Features
- 📱 **Install as app** - Add to home screen
- 🚀 **Fast loading** - Cached assets
- 🔄 **Background sync** - Automatic data synchronization
- 📲 **Native experience** - App-like interface

## 🔧 How It Works

### 1. Online Detection
The app automatically detects when you're online or offline using the browser's `navigator.onLine` API.

### 2. Local Storage
All data is stored locally using IndexedDB:
- **Lists**: Complete list data with metadata
- **Items**: All item details including images
- **Sync Queue**: Pending changes waiting to sync

### 3. Offline Operations
When offline:
1. Changes are immediately saved to local storage
2. UI updates optimistically for instant feedback
3. Changes are queued for later synchronization
4. Visual indicators show offline status

### 4. Synchronization
When back online:
1. App detects connection restoration
2. Queued changes sync automatically
3. Conflicts are resolved intelligently
4. Success/error feedback provided

## 🎯 User Experience

### Visual Indicators

#### Online Status
- **🟢 Online**: Green indicator when connected
- **🟠 Offline**: Orange indicator with pending changes count
- **🟡 Syncing**: Yellow indicator when changes are pending sync
- **🔴 Error**: Red indicator for sync errors with retry option

#### Offline Banner
Full-screen notification when offline with:
- Clear offline status
- Available features list
- Sync status information

### Sync Behavior
- **Automatic**: Syncs every 30 seconds when online
- **Manual**: Click "Sync Now" button for immediate sync
- **Retry Logic**: Failed syncs retry up to 3 times
- **Background**: Syncs happen without interrupting work

## 📱 PWA Installation

### Desktop
1. Look for the install prompt (📱 icon)
2. Click "Install" or use browser menu
3. App launches in standalone window

### Mobile
1. Open browser menu (⋮ or ⋯)
2. Select "Add to Home Screen"
3. App appears as native app

### Benefits
- Faster loading times
- Offline access to cached pages
- Native app experience
- Push notifications (future)

## 🧪 Testing Offline Mode

### Manual Testing
1. **Start the app**: `npm run dev`
2. **Go offline**: Disconnect internet or use DevTools
3. **Test operations**:
   - Add new items to a list
   - Edit existing items
   - Check/uncheck items
   - Delete items
   - Create new lists
4. **Go back online**: Reconnect internet
5. **Verify sync**: Check if changes appear in database

### Browser DevTools Testing
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Test app functionality
5. Uncheck "Offline" to restore connection

### Service Worker Testing
1. Open DevTools
2. Go to Application tab
3. Check Service Workers section
4. Verify service worker is registered
5. Test cache storage

## 🔍 Technical Implementation

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   IndexedDB     │    │   Supabase      │
│                 │◄──►│   (Local)       │◄──►│   (Remote)      │
│ - UI Components │    │ - Lists         │    │ - Database      │
│ - State Mgmt    │    │ - Items         │    │ - Auth          │
│ - Offline Hooks │    │ - Sync Queue    │    │ - Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Service Worker  │    │ Sync Service    │    │ PWA Manifest   │
│                 │    │                 │    │                 │
│ - Cache Assets  │    │ - Online/Offline│    │ - App Metadata │
│ - Offline Pages │    │ - Sync Logic    │    │ - Icons         │
│ - Background    │    │ - Conflict Res. │    │ - Display Mode │
│   Sync          │    │ - Retry Logic   │    │ - Shortcuts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

#### 1. IndexedDB (`src/lib/offline/db.ts`)
- Local database for offline storage
- Stores lists, items, and sync queue
- Handles CRUD operations locally

#### 2. Sync Service (`src/lib/offline/sync.ts`)
- Manages online/offline state
- Handles synchronization logic
- Provides offline CRUD operations

#### 3. React Hooks (`src/lib/offline/hooks.ts`)
- `useOfflineSync`: Sync status and operations
- `useOfflineCapability`: Browser support detection

#### 4. Service Worker (`public/sw.js`)
- Caches app assets
- Serves offline pages
- Handles background sync

#### 5. PWA Components
- `OfflineIndicator`: Status display
- `OfflineBanner`: Full-screen notification
- `InstallPrompt`: PWA installation

### Data Flow

#### Online Mode
```
User Action → React Component → Supabase API → Database
                ↓
            Update UI
```

#### Offline Mode
```
User Action → React Component → IndexedDB → Sync Queue
                ↓                    ↓
            Update UI          Queue for Sync
```

#### Sync Process
```
Online Detection → Process Queue → Supabase API → Update Local DB
                        ↓
                    Update UI
```

## 🛠️ Configuration

### Environment Variables
No additional environment variables required for offline functionality.

### Browser Requirements
- Modern browser with IndexedDB support
- Service Worker support
- HTTPS required for PWA features (except localhost)

### Build Configuration
The offline features are automatically included in the build:
- Service worker is copied to `public/`
- PWA manifest is included
- Offline components are bundled

## 🐛 Troubleshooting

### Common Issues

#### Service Worker Not Registering
- Check browser console for errors
- Verify HTTPS (except localhost)
- Clear browser cache and reload

#### IndexedDB Not Working
- Check browser support
- Clear IndexedDB data
- Check for storage quota issues

#### Sync Not Working
- Verify internet connection
- Check Supabase configuration
- Review sync queue in DevTools

#### PWA Not Installing
- Check manifest.json validity
- Verify icons exist
- Test on supported browser

### Debug Tools
- **DevTools Application Tab**: View IndexedDB, Service Workers, Cache
- **DevTools Network Tab**: Monitor sync requests
- **Browser Console**: Check for errors and logs

## 📈 Performance

### Caching Strategy
- **Static Assets**: Cached on first visit
- **Dynamic Content**: Cached as needed
- **API Responses**: Not cached (always fresh)

### Storage Usage
- **Lists**: ~1KB per list
- **Items**: ~500B per item
- **Images**: Cached separately
- **Sync Queue**: Minimal overhead

### Sync Performance
- **Background**: Non-blocking
- **Batch Operations**: Efficient batching
- **Retry Logic**: Exponential backoff

## 🔮 Future Enhancements

### Planned Features
- **Push Notifications**: Real-time updates
- **Conflict Resolution**: Advanced merge strategies
- **Selective Sync**: Choose what to sync
- **Offline Analytics**: Track offline usage
- **Multi-device Sync**: Cross-device synchronization

### Performance Improvements
- **Compression**: Reduce storage usage
- **Incremental Sync**: Only sync changes
- **Smart Caching**: Predictive caching
- **Background Processing**: Web Workers

## 📚 Additional Resources

- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB)
- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: Offline](https://web.dev/offline/)

---

**Note**: This offline functionality is designed to work seamlessly with the existing app. Users can continue using the app normally, and the offline features will automatically activate when needed.