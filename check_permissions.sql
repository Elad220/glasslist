-- Check current user and permissions
SELECT current_user, session_user;

-- Check if we have permission to create triggers
SELECT has_database_privilege(current_user, current_database(), 'CREATE');

-- Check if there are any security policies that might block the trigger
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('shopping_lists', 'items')
ORDER BY tablename, policyname;

-- Check table ownership
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pg_get_userbyid(c.relowner) as owner,
    has_table_privilege(current_user, c.oid, 'TRIGGER') as can_create_trigger
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('shopping_lists', 'items')
AND n.nspname = 'public';

-- Alternative approach: Update shopping list directly when modifying items
-- This can be used if triggers don't work
/*
-- When creating an item:
WITH new_item AS (
  INSERT INTO items (list_id, name, amount, unit, category)
  VALUES ('your-list-id', 'New Item', 1, 'pcs', 'Other')
  RETURNING list_id
)
UPDATE shopping_lists 
SET updated_at = NOW() 
WHERE id = (SELECT list_id FROM new_item);

-- When updating an item:
WITH updated_item AS (
  UPDATE items 
  SET name = 'Updated Name'
  WHERE id = 'item-id'
  RETURNING list_id
)
UPDATE shopping_lists 
SET updated_at = NOW() 
WHERE id = (SELECT list_id FROM updated_item);
*/