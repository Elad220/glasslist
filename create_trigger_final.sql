-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_list_timestamp_on_item_change ON items;
DROP FUNCTION IF EXISTS update_list_timestamp_on_item_change();

-- Create the function
CREATE OR REPLACE FUNCTION update_list_timestamp_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT and UPDATE, use NEW.list_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE shopping_lists 
    SET updated_at = NOW() 
    WHERE id = NEW.list_id;
    RETURN NEW;
  -- For DELETE, use OLD.list_id
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE shopping_lists 
    SET updated_at = NOW() 
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_list_timestamp_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_list_timestamp_on_item_change();

-- Verify it was created
SELECT 
    'Trigger created: ' || tgname as status,
    tgenabled as is_enabled
FROM pg_trigger
WHERE tgname = 'update_list_timestamp_on_item_change';

-- Test it immediately
WITH test_update AS (
    SELECT i.id as item_id, i.list_id, sl.updated_at as before_update
    FROM items i
    JOIN shopping_lists sl ON sl.id = i.list_id
    LIMIT 1
),
do_update AS (
    UPDATE items 
    SET notes = COALESCE(notes, '') || ' [Trigger test: ' || NOW()::time || ']'
    WHERE id = (SELECT item_id FROM test_update)
    RETURNING id, list_id
)
SELECT 
    sl.name as list_name,
    tu.before_update,
    sl.updated_at as after_update,
    CASE 
        WHEN sl.updated_at > tu.before_update THEN '✅ TRIGGER IS NOW WORKING!'
        ELSE '❌ TRIGGER STILL NOT WORKING'
    END as result
FROM shopping_lists sl
JOIN do_update du ON sl.id = du.list_id
CROSS JOIN test_update tu;