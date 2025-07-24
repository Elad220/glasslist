-- TEMPORARY: Disable RLS completely for debugging
-- Run this in Supabase SQL Editor if you want to test without RLS
-- DO NOT USE IN PRODUCTION

-- Disable RLS on all tables
ALTER TABLE public.shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test query
SELECT 'RLS disabled, testing basic query:' as status;
SELECT id, name, user_id, created_at FROM public.shopping_lists LIMIT 3;

-- To re-enable RLS later, run restore_security.sql 