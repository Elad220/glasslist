-- Fix the trigger that's causing the foreign key violation
-- The issue is that the trigger runs BEFORE INSERT, but tries to insert into list_members
-- which needs the shopping_list to exist first

-- Drop the existing problematic trigger
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON shopping_lists;

-- Recreate the function to work with AFTER INSERT
CREATE OR REPLACE FUNCTION create_list_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the list creator as owner (now the list exists)
  INSERT INTO list_members (list_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger as AFTER INSERT instead of BEFORE INSERT
CREATE TRIGGER create_owner_membership_trigger
  AFTER INSERT ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION create_list_owner_membership();

-- Also update the created_by field separately if needed
-- We'll handle this in the application code instead of the trigger
