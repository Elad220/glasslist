# Delete List Bug Fix

## Problem Description
When deleting a list from the dashboard view, the list would reappear when refreshing the page instead of staying removed. This was happening because of a race condition in the offline sync system.

## Root Cause
The issue was caused by two main problems in the offline sync system:

1. **Server data overwriting local deletions**: When a list was marked for deletion locally (with `pendingOperation: 'delete'`), but the sync hadn't completed yet, the `mergeServerData` method would overwrite the local deletion with server data during the pull phase.

2. **Online fetch ignoring local deletions**: When the app was online, the `getShoppingLists` method would fetch data from Supabase first and return it without considering local pending deletions, causing deleted lists to reappear.

## Solution
The fix involved three main changes:

### 1. Fixed `mergeServerData` in `src/lib/offline/sync.ts`
Added checks to prevent server data from overwriting local deletions:

```typescript
// Check if local record is marked for deletion
if (localRecord.pendingOperation === 'delete') {
  // Don't overwrite local deletion with server data
  // The deletion will be synced to server in the push phase
  continue
}
```

### 2. Fixed `getShoppingLists` in `src/lib/offline/client.ts`
Modified to always check local pending deletions and filter them out, even when fetching from server:

```typescript
// Always get local pending deletions to filter them out
const localListRecords = await offlineStorage.getShoppingLists(userId)
const pendingDeletions = new Set(
  localListRecords
    .filter(record => record.pendingOperation === 'delete')
    .map(record => record.id)
)

// Filter out pending deletions from server data
const transformedData: ShoppingListWithItems[] = data
  .filter(list => !pendingDeletions.has(list.id))
  .map(list => ({ ... }))
```

### 3. Fixed `getListItems` and `getShoppingList` in `src/lib/offline/client.ts`
Applied the same filtering logic to ensure consistency across all data fetching methods.

## How It Works Now
1. When a user deletes a list, it's marked for deletion locally with `pendingOperation: 'delete'`
2. The list is immediately removed from the UI
3. When the page is refreshed, the app checks for local pending deletions and filters them out
4. The deletion is synced to the server in the background
5. Once synced, the list is permanently removed from local storage

## Testing
To test the fix:
1. Create a shopping list
2. Delete the list from the dashboard
3. Refresh the page
4. Verify the list does not reappear

The fix ensures that local deletions are respected even when there are network delays or sync conflicts.