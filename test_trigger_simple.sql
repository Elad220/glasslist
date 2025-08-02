-- 1. First check if trigger exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_list_timestamp_on_item_change'
) as trigger_exists;

-- 2. Get a list and its current updated_at
SELECT 
    sl.id,
    sl.name,
    sl.updated_at as before_update,
    i.id as item_id,
    i.name as item_name
FROM shopping_lists sl
JOIN items i ON i.list_id = sl.id
WHERE sl.user_id = auth.uid()
LIMIT 1;

-- 3. Note the list ID and item ID from above, then run this update
-- Replace 'YOUR_ITEM_ID' with the actual item ID from step 2
/*
UPDATE items 
SET name = name || ' (updated)'
WHERE id = 'YOUR_ITEM_ID'
RETURNING id, name, updated_at;
*/

-- 4. Check if the list's updated_at changed
-- Replace 'YOUR_LIST_ID' with the actual list ID from step 2
/*
SELECT 
    id,
    name,
    updated_at as after_update
FROM shopping_lists
WHERE id = 'YOUR_LIST_ID';
*/