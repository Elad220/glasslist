-- Debug SQL to test authentication and RLS
-- Run these queries in Supabase SQL Editor to debug issues

-- 1. Check current authentication (this will be null in SQL editor, but useful for reference)
SELECT auth.uid() as current_user_id;

-- 2. Check if RLS is enabled on shopping_lists
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'shopping_lists';

-- 3. List all policies on shopping_lists table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'shopping_lists';

-- 4. Check if there are any users in auth.users
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check existing shopping_lists data
SELECT id, user_id, name, created_at
FROM public.shopping_lists
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check JWT settings and configuration
SELECT name, setting 
FROM pg_settings 
WHERE name LIKE '%jwt%' OR name LIKE '%auth%'
ORDER BY name;

-- 7. Check if auth schema exists and is accessible
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- 8. Test if we can access auth functions
SELECT proname 
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
AND proname = 'uid';

-- 9. Try to manually test the RLS policy condition
-- This should show what auth.uid() evaluates to in different contexts
SELECT 
  auth.uid() as auth_uid,
  current_user as pg_user,
  session_user as session_user,
  current_setting('request.jwt.claims', true) as jwt_claims;

-- 10. Test if we can manually insert (this should fail if RLS is working correctly)
-- Don't run this unless you want to test RLS
-- INSERT INTO public.shopping_lists (user_id, name, description) 
-- VALUES ('test-user-id', 'Test List', 'Test Description'); 