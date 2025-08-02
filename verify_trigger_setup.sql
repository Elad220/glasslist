-- Comprehensive trigger verification

-- 1. Check if the trigger exists
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgtype as trigger_type,
    tgenabled as is_enabled,
    proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgname = 'update_list_timestamp_on_item_change';

-- 2. If no results above, check all triggers on items table
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as is_enabled,
    proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid = 'items'::regclass
AND tgisinternal = false;

-- 3. Check if the function exists
SELECT 
    proname as function_name,
    pronargs as arg_count,
    prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'update_list_timestamp_on_item_change';

-- 4. If the trigger doesn't exist, here's the SQL to create it again:
/*
-- Function to update shopping list's updated_at when items are modified
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

-- Create trigger for items table
CREATE TRIGGER update_list_timestamp_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_list_timestamp_on_item_change();
*/