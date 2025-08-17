-- Add AI feature toggles to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_quick_add_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_voice_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_suggestions_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_analytics_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_tips_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_insights_enabled BOOLEAN DEFAULT true;

-- Update the trigger function to include new columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add comments for the new columns
COMMENT ON COLUMN profiles.ai_quick_add_enabled IS 'Enable AI-powered natural language parsing for quick add feature';
COMMENT ON COLUMN profiles.ai_voice_enabled IS 'Enable AI-powered voice recording analysis';
COMMENT ON COLUMN profiles.ai_suggestions_enabled IS 'Enable AI-powered shopping suggestions based on patterns';
COMMENT ON COLUMN profiles.ai_auto_populate_enabled IS 'Enable AI-powered auto-population of item details';
COMMENT ON COLUMN profiles.ai_analytics_enabled IS 'Enable AI-powered shopping analytics and insights';
COMMENT ON COLUMN profiles.ai_tips_enabled IS 'Enable AI-powered smart shopping tips and recommendations';
COMMENT ON COLUMN profiles.ai_insights_enabled IS 'Enable AI-powered intelligent pattern analysis';