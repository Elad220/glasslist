-- Quick fix for 500 error on shopping_lists
-- Run this entire script in Supabase SQL Editor

-- 1. DISABLE RLS TEMPORARILY (for debugging)
ALTER TABLE public.shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. GRANT ALL PERMISSIONS TO SUPABASE ROLES
GRANT ALL ON public.shopping_lists TO anon;
GRANT ALL ON public.shopping_lists TO authenticated;
GRANT ALL ON public.items TO anon;
GRANT ALL ON public.items TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

-- 3. GRANT SEQUENCE PERMISSIONS  
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. CHECK IF TABLES EXIST
SELECT 'Checking if tables exist:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shopping_lists', 'items', 'profiles')
ORDER BY table_name;

-- 5. TEST BASIC QUERIES
SELECT 'Testing basic shopping_lists query:' as info;
SELECT COUNT(*) as shopping_lists_count FROM public.shopping_lists;

SELECT 'Testing basic items query:' as info;  
SELECT COUNT(*) as items_count FROM public.items;

-- 6. TEST THE EXACT QUERY OUR APP IS RUNNING
SELECT 'Testing app query:' as info;
SELECT id, user_id, name, description, is_shared, created_at 
FROM public.shopping_lists 
WHERE is_archived = false 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. CHECK AUTH SETUP
SELECT 'Checking auth setup:' as info;
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- If this all works, the issue is likely Node.js version or app configuration 