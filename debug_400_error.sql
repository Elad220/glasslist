-- Debug 400 error on list access
-- Run in Supabase SQL Editor

-- 1. Check if shopping_lists table has expected columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'shopping_lists'
ORDER BY ordinal_position;

-- 2. Check if items table has expected columns  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

-- 3. Test basic list query
SELECT id, name, user_id, created_at
FROM public.shopping_lists 
LIMIT 3;

-- 4. Test basic items query
SELECT id, list_id, name, is_checked
FROM public.items 
LIMIT 3;

-- 5. Check if we have any actual data
SELECT 
  'shopping_lists' as table_name,
  COUNT(*) as row_count
FROM public.shopping_lists
UNION ALL
SELECT 
  'items' as table_name,
  COUNT(*) as row_count  
FROM public.items;

-- 6. Test the exact query our app would run (replace 'test-id' with a real list ID)
-- SELECT * FROM public.shopping_lists WHERE id = 'some-real-list-id'; 