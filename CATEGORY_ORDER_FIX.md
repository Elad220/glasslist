# Category Order Persistence Fix

## Problem
The aisle/category ordering when using drag and drop didn't persist after:
1. Page refresh
2. Undoing a delete on an item

## Root Cause
The `orderedCategories` state was only stored in React component state and was reset every time `loadData()` was called (which happens on page refresh and after undo operations).

## Solution
Implemented persistent storage for category order by:

### 1. Database Schema Changes
- Added `category_order` JSONB column to `shopping_lists` table
- Created migration script: `sql/add_category_order_column.sql`

### 2. Backend Changes
- Added `updateCategoryOrder()` function in `src/lib/supabase/client.ts`
- Updated TypeScript types in `src/lib/supabase/types.ts` to include `category_order` field

### 3. Frontend Changes
- Modified `loadData()` function to load saved category order from database
- Updated `onDragEnd()` function to persist category order changes
- Enhanced `useEffect` for category changes to persist when new categories are added
- Added fallback logic to handle cases where no saved order exists

## Key Implementation Details

### Loading Category Order
```typescript
// Load category order from the list, or create default order from items
const savedCategoryOrder = listData.category_order as string[] | null
const availableCategories = Array.from(new Set(itemsData.map(item => item.category || 'Other')))

if (savedCategoryOrder && savedCategoryOrder.length > 0) {
  // Use saved order, but add any new categories that aren't in the saved order
  const newCategories = availableCategories.filter(cat => !savedCategoryOrder.includes(cat))
  const finalOrder = [...savedCategoryOrder, ...newCategories]
  setOrderedCategories(finalOrder)
} else {
  // No saved order, use default order from items
  setOrderedCategories(availableCategories)
}
```

### Persisting Category Order
```typescript
const onDragEnd = async (result: any) => {
  // ... reorder logic ...
  
  // Persist the new category order to the database
  if (!isDemoMode) {
    try {
      await updateCategoryOrder(listId, newOrderedCategories)
    } catch (error) {
      console.error('Failed to save category order:', error)
    }
  }
}
```

## Benefits
1. **Persistence**: Category order now survives page refreshes
2. **Undo Compatibility**: Order is maintained when undoing item deletions
3. **Backward Compatibility**: Existing lists without saved order work normally
4. **New Category Handling**: New categories are automatically added to the end of the order
5. **Error Handling**: Graceful degradation if database operations fail

## Testing
- Created and ran test script to verify the logic works correctly
- Test covers drag-and-drop reordering, page refresh simulation, and new category addition

## Migration
Run the migration script on existing databases:
```sql
-- Execute sql/add_category_order_column.sql
```

This will add the `category_order` column to existing `shopping_lists` tables without affecting existing data.