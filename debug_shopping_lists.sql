-- Debug script for shopping_lists 500 error
-- Run this in Supabase SQL Editor to identify the issue

-- 1. Check if RLS is enabled and what policies exist
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'shopping_lists';

-- 2. List all policies on shopping_lists
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'shopping_lists';

-- 3. Check if auth.uid() is working
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 4. Try a simple SELECT on shopping_lists
SELECT id, name, user_id, created_at 
FROM public.shopping_lists 
LIMIT 5;

-- 5. Test the complex query that's failing
SELECT 
    sl.*,
    (
        SELECT json_agg(
            json_build_object('id', i.id, 'is_checked', i.is_checked)
        )
        FROM public.items i 
        WHERE i.list_id = sl.id
    ) as items
FROM public.shopping_lists sl
ORDER BY sl.created_at DESC;

-- 6. Check permissions on both tables
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges
WHERE table_name IN ('shopping_lists', 'items')
AND table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type; 