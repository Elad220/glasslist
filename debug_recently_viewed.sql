-- Check if the trigger exists
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'update_list_timestamp_on_item_change';

-- Check recent shopping lists ordered by updated_at
SELECT 
    id,
    name,
    updated_at,
    created_at,
    updated_at - created_at as time_since_creation
FROM shopping_lists
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 10;

-- Test the trigger by updating an item
-- First, show current state of a list
SELECT 
    sl.id as list_id,
    sl.name as list_name,
    sl.updated_at as list_updated_at,
    COUNT(i.id) as item_count
FROM shopping_lists sl
LEFT JOIN items i ON i.list_id = sl.id
WHERE sl.user_id = auth.uid()
GROUP BY sl.id, sl.name, sl.updated_at
ORDER BY sl.updated_at DESC
LIMIT 1;

-- Update an item in the oldest list to test if it moves to the top
WITH oldest_list AS (
    SELECT id 
    FROM shopping_lists 
    WHERE user_id = auth.uid() 
    ORDER BY updated_at ASC 
    LIMIT 1
),
first_item AS (
    SELECT i.id 
    FROM items i
    JOIN oldest_list ol ON i.list_id = ol.id
    LIMIT 1
)
UPDATE items 
SET notes = 'Testing trigger - ' || NOW()::text
WHERE id = (SELECT id FROM first_item)
RETURNING id, list_id, notes;

-- Check if the list's updated_at changed
SELECT 
    id,
    name,
    updated_at,
    NOW() - updated_at as time_ago
FROM shopping_lists
WHERE user_id = auth.uid()
ORDER BY updated_at DESC
LIMIT 10;