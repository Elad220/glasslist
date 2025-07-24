-- Debug PostgreSQL permissions and roles
-- Run this in Supabase SQL Editor to diagnose the permission issue

-- 1. Check current role and user
SELECT current_user, session_user, current_role;

-- 2. Check what roles exist
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin 
FROM pg_roles 
ORDER BY rolname;

-- 3. Check table permissions for anon role
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'shopping_lists'
AND table_schema = 'public';

-- 4. Check if the table exists and its owner
SELECT schemaname, tablename, tableowner, hasindexes, hasrules, hastriggers
FROM pg_tables 
WHERE tablename = 'shopping_lists';

-- 5. Grant permissions to anon role (this might fix the issue)
GRANT ALL ON public.shopping_lists TO anon;
GRANT ALL ON public.shopping_lists TO authenticated;

-- 6. Also grant sequence permissions if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Verify the grants worked
SELECT grantee, privilege_type 
FROM information_schema.table_privileges
WHERE table_name = 'shopping_lists'
AND grantee IN ('anon', 'authenticated');
