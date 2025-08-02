-- Manual trigger test without auth dependency

-- 1. First, let's see some actual data
SELECT 
    sl.id as list_id,
    sl.name as list_name,
    sl.updated_at as list_before_update,
    i.id as item_id,
    i.name as item_name
FROM shopping_lists sl
JOIN items i ON i.list_id = sl.id
LIMIT 5;

-- 2. Pick one item from above results and note its ID and the list's current updated_at
-- Then run this update (replace with actual item ID):
/*
UPDATE items 
SET name = name || ' - updated at ' || NOW()::time
WHERE id = 'PASTE-ITEM-ID-HERE'
RETURNING id, list_id, name, updated_at;
*/

-- 3. After running the update above, check if the list's updated_at changed:
-- (replace with the list_id from step 1)
/*
SELECT 
    id,
    name,
    updated_at as list_after_update,
    NOW() - updated_at as seconds_ago
FROM shopping_lists
WHERE id = 'PASTE-LIST-ID-HERE';
*/

-- 4. Alternative: Update the first item found and check results immediately
WITH item_to_update AS (
    SELECT i.id as item_id, i.list_id
    FROM items i
    JOIN shopping_lists sl ON sl.id = i.list_id
    LIMIT 1
),
list_before AS (
    SELECT sl.updated_at as before_timestamp
    FROM shopping_lists sl
    JOIN item_to_update itu ON sl.id = itu.list_id
),
do_update AS (
    UPDATE items 
    SET notes = 'Trigger test at ' || NOW()::text
    WHERE id = (SELECT item_id FROM item_to_update)
    RETURNING id, list_id
)
SELECT 
    sl.id,
    sl.name,
    lb.before_timestamp,
    sl.updated_at as after_timestamp,
    CASE 
        WHEN sl.updated_at > lb.before_timestamp THEN 'TRIGGER WORKED!'
        ELSE 'TRIGGER DID NOT WORK'
    END as result
FROM shopping_lists sl
JOIN do_update du ON sl.id = du.list_id
CROSS JOIN list_before lb;