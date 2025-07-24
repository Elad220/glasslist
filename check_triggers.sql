-- Check for any triggers that might be causing the list_members issue

-- 1. List all triggers in the database
SELECT 
  schemaname,
  tablename,
  triggername,
  definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('shopping_lists', 'list_members');

-- 2. Check for any functions that might auto-create list_members
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%list_members%';

-- 3. Look at the actual table structure
\d public.shopping_lists
\d public.list_members

-- 4. Check if there are any constraints or foreign keys
SELECT
  conname as constraint_name,
  contype as constraint_type,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid IN ('public.shopping_lists'::regclass, 'public.list_members'::regclass)
OR confrelid IN ('public.shopping_lists'::regclass, 'public.list_members'::regclass);
