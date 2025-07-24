-- TEMPORARY: Disable RLS for testing
-- This will allow you to test if the issue is with RLS policies or authentication
-- DO NOT USE IN PRODUCTION - this removes all security

-- Disable RLS on all tables
ALTER TABLE public.shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later, run:
-- ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 