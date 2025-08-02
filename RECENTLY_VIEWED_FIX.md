# Recently Viewed Lists Bug Fix

## Problem
The recently viewed list mechanism wasn't working properly. Lists weren't appearing in the correct order in the dashboard, with the most recently used lists not appearing first.

## Root Causes
1. **Missing sorting in offline mode**: When lists were fetched from IndexedDB (offline storage), they weren't sorted by `updated_at`.
2. **Missing sorting in dashboard**: The dashboard component wasn't sorting lists after fetching them.
3. **List timestamp not updated on item changes**: The shopping list's `updated_at` timestamp was only updated when the list itself was modified (name, description, etc.), but not when items were added, updated, or deleted.
4. **Dashboard not refreshing on navigation**: When navigating back to the dashboard from a list page, the lists weren't being refreshed, showing stale data.

## Solution

### 1. Added Sorting in Dashboard (`src/app/dashboard/page.tsx`)
- Modified `fetchShoppingLists` to sort lists by `updated_at` in descending order after fetching
- Added debug logging to track sorting behavior
- Ensures the most recently used lists appear first in the UI

### 2. Added Sorting in Offline Client (`src/lib/offline/client.ts`)
- Modified `getShoppingLists` to sort lists by `updated_at` when fetching from IndexedDB
- Ensures consistent behavior between online and offline modes

### 3. Update List Timestamp on Item Changes
- Created database trigger (`sql/fix_recently_viewed_trigger.sql`) that automatically updates the shopping list's `updated_at` when items are modified
- Modified offline client methods to update list timestamps:
  - `createItem`: Updates parent list's `updated_at` when item is created
  - `updateItem`: Updates parent list's `updated_at` when item is modified
  - `deleteItem`: Updates parent list's `updated_at` when item is deleted
- Added debug logging to track timestamp updates

### 4. Dashboard Auto-Refresh
- Added event listeners for `focus` and `visibilitychange` events
- Dashboard now refreshes shopping lists when:
  - User navigates back to the dashboard
  - Browser tab regains focus
  - Page becomes visible after being hidden

## Database Migration Required
Run the following SQL to add the trigger:
```sql
-- Execute the contents of sql/fix_recently_viewed_trigger.sql
```

## Debugging Steps

### 1. Verify Trigger Exists
Run this SQL in Supabase SQL editor:
```sql
SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_list_timestamp_on_item_change'
) as trigger_exists;
```

### 2. Check Console Logs
Open browser developer console and look for:
- "Dashboard: Lists before sorting" - shows the order lists are fetched
- "Dashboard: Lists after sorting" - shows the order after sorting
- "Dashboard: Page gained focus, refreshing lists..." - confirms refresh on navigation
- "OfflineClient: Updating list timestamp..." - confirms timestamp updates

### 3. Manual Test
1. Note which list is currently at the top
2. Go to an older list and add/modify an item
3. Navigate back to dashboard
4. The modified list should now appear at the top

### 4. Check Database Directly
Run `test_trigger_simple.sql` to manually verify the trigger is working.

## Testing
1. Create a new shopping list
2. Add items to different lists
3. Check that the list you just modified appears first in the "Recent Lists" section
4. Update items in an older list
5. Verify that list now appears at the top
6. Test both online and offline modes
7. Navigate away and back to dashboard - lists should refresh

## Impact
- Lists will now properly reflect their actual usage patterns
- The "Recent Lists" section will show genuinely recently used lists
- Better user experience as frequently used lists are easily accessible
- Dashboard stays up-to-date when navigating between pages