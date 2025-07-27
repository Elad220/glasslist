-- Add AI suggestions toggle to profiles table
-- This allows users to enable/disable the AI suggestions feature

ALTER TABLE profiles 
ADD COLUMN ai_suggestions_enabled BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.ai_suggestions_enabled IS 'Whether AI suggestions feature is enabled for this user';