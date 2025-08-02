-- Working queries for Supabase SQL Editor (without auth context)

-- 1. Find your user ID from the Auth dashboard, or use this query:
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Once you have your user ID, test the trigger with these queries:
-- Replace 'YOUR-USER-ID' with your actual user ID from above

-- First, check your shopping lists
SELECT 
    id,
    name,
    updated_at,
    created_at
FROM shopping_lists
WHERE user_id = 'YOUR-USER-ID'
ORDER BY updated_at DESC;

-- 3. Test the trigger by updating an item
-- This will update the first item found in your lists and check if the trigger works
WITH your_user AS (
    SELECT 'YOUR-USER-ID'::uuid as user_id  -- REPLACE WITH YOUR USER ID
),
item_to_update AS (
    SELECT i.id as item_id, i.list_id, sl.updated_at as list_updated_before
    FROM items i
    JOIN shopping_lists sl ON sl.id = i.list_id
    JOIN your_user yu ON sl.user_id = yu.user_id
    LIMIT 1
),
do_update AS (
    UPDATE items 
    SET notes = 'Trigger test at ' || NOW()::text
    WHERE id = (SELECT item_id FROM item_to_update)
    RETURNING id, list_id
)
SELECT 
    sl.id as list_id,
    sl.name as list_name,
    itu.list_updated_before as updated_before,
    sl.updated_at as updated_after,
    CASE 
        WHEN sl.updated_at > itu.list_updated_before THEN '✅ TRIGGER IS WORKING!'
        ELSE '❌ TRIGGER NOT WORKING'
    END as trigger_status,
    sl.updated_at - itu.list_updated_before as time_difference
FROM shopping_lists sl
JOIN do_update du ON sl.id = du.list_id
JOIN item_to_update itu ON itu.list_id = sl.id;

-- 4. Alternative: Simple test without CTE
-- First run this to see your data:
/*
SELECT 
    sl.id as list_id,
    sl.name,
    sl.updated_at,
    i.id as item_id,
    i.name as item_name
FROM shopping_lists sl
JOIN items i ON i.list_id = sl.id
WHERE sl.user_id = 'YOUR-USER-ID'
LIMIT 5;
*/

-- Then update one item and check the list's timestamp:
/*
UPDATE items 
SET name = name || ' (test)'
WHERE id = 'ITEM-ID-FROM-ABOVE'
RETURNING *;

-- Then immediately check:
SELECT * FROM shopping_lists WHERE id = 'LIST-ID-FROM-ABOVE';
*/