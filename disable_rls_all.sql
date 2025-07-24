-- Completely disable RLS on all tables for testing
ALTER TABLE IF EXISTS public.shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.list_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.list_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Also drop any existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow all authenticated users (DEBUG)" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can view their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.shopping_lists;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%list%';
