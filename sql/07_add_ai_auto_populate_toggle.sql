-- Add AI auto-populate toggle to profiles table
-- This allows users to enable/disable the AI auto-populate feature for item forms

ALTER TABLE profiles 
ADD COLUMN ai_auto_populate_enabled BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.ai_auto_populate_enabled IS 'Whether AI auto-populate feature is enabled for this user'; 