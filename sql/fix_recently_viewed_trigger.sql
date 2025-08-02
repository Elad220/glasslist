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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_list_timestamp_on_item_change ON items;

-- Create trigger for items table
CREATE TRIGGER update_list_timestamp_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_list_timestamp_on_item_change();

-- Add comment explaining the trigger
COMMENT ON TRIGGER update_list_timestamp_on_item_change ON items IS 
  'Updates the shopping list updated_at timestamp whenever items in that list are created, updated, or deleted';