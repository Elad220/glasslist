-- 1. Check if auth.uid() is returning a value
SELECT auth.uid() as current_user_id;

-- 2. Check all shopping lists (without user filter)
SELECT 
    id,
    user_id,
    name,
    updated_at,
    created_at,
    (SELECT COUNT(*) FROM items WHERE list_id = shopping_lists.id) as item_count
FROM shopping_lists
ORDER BY updated_at DESC
LIMIT 10;

-- 3. Check if there are any items at all
SELECT COUNT(*) as total_items FROM items;

-- 4. Check shopping lists for a specific user (replace with your user ID)
-- You can get your user ID from the Auth section in Supabase dashboard
/*
SELECT 
    sl.id,
    sl.name,
    sl.updated_at,
    sl.created_at,
    COUNT(i.id) as item_count
FROM shopping_lists sl
LEFT JOIN items i ON i.list_id = sl.id
WHERE sl.user_id = 'YOUR-USER-ID-HERE'
GROUP BY sl.id, sl.name, sl.updated_at, sl.created_at
ORDER BY sl.updated_at DESC;
*/

-- 5. Test query without user filter to see data structure
SELECT 
    sl.id as list_id,
    sl.name as list_name,
    sl.user_id,
    sl.updated_at as list_updated,
    i.id as item_id,
    i.name as item_name,
    i.updated_at as item_updated
FROM shopping_lists sl
LEFT JOIN items i ON i.list_id = sl.id
ORDER BY sl.updated_at DESC
LIMIT 20;

-- 6. Check if the trigger function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'update_list_timestamp_on_item_change';

-- 7. Check if any lists have been updated recently
SELECT 
    id,
    name,
    updated_at,
    NOW() - updated_at as time_since_update
FROM shopping_lists
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;