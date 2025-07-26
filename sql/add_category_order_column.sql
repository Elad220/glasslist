-- Migration to add category_order column to shopping_lists table
-- This script should be run on existing databases to add the new column

-- Add the category_order column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shopping_lists' 
        AND column_name = 'category_order'
    ) THEN
        ALTER TABLE shopping_lists 
        ADD COLUMN category_order JSONB DEFAULT '[]'::jsonb;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN shopping_lists.category_order IS 'Stores ordered array of category names for custom aisle ordering';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'shopping_lists' 
AND column_name = 'category_order';