-- Fix RLS Policies Properly for GlassList
-- This creates secure policies that work correctly
-- Run this entire script in Supabase SQL Editor

-- =============================================
-- STEP 1: CLEAN UP AND RE-ENABLE RLS
-- =============================================

-- Re-enable RLS on all tables (security first!)
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean up any old policies
DROP POLICY IF EXISTS "Allow all authenticated users (DEBUG)" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can view their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.shopping_lists;

DROP POLICY IF EXISTS "Users can view items from their own lists" ON public.items;
DROP POLICY IF EXISTS "Users can insert items to their own lists" ON public.items;
DROP POLICY IF EXISTS "Users can update items in their own lists" ON public.items;
DROP POLICY IF EXISTS "Users can delete items from their own lists" ON public.items;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- =============================================
-- STEP 2: GRANT PROPER TABLE PERMISSIONS
-- =============================================

-- These are essential for RLS to work
GRANT ALL ON public.shopping_lists TO authenticated;
GRANT ALL ON public.items TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Also grant to anon for public operations
GRANT SELECT ON public.shopping_lists TO anon;
GRANT SELECT ON public.items TO anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- STEP 3: SIMPLE, WORKING RLS POLICIES
-- =============================================

-- SHOPPING LISTS POLICIES (Simple and reliable)
CREATE POLICY "authenticated_users_select_own_lists" ON public.shopping_lists
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_lists" ON public.shopping_lists
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_lists" ON public.shopping_lists
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_lists" ON public.shopping_lists
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ITEMS POLICIES (Simple join - no complex subqueries)
CREATE POLICY "authenticated_users_select_own_items" ON public.items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = items.list_id 
            AND sl.user_id = auth.uid()
        )
    );

CREATE POLICY "authenticated_users_insert_own_items" ON public.items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = items.list_id 
            AND sl.user_id = auth.uid()
        )
    );

CREATE POLICY "authenticated_users_update_own_items" ON public.items
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = items.list_id 
            AND sl.user_id = auth.uid()
        )
    );

CREATE POLICY "authenticated_users_delete_own_items" ON public.items
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = items.list_id 
            AND sl.user_id = auth.uid()
        )
    );

-- PROFILES POLICIES (Simple and straightforward)
CREATE POLICY "users_select_own_profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================
-- STEP 4: VERIFY POLICIES ARE WORKING
-- =============================================

-- Check RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('shopping_lists', 'items', 'profiles')
ORDER BY tablename;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('shopping_lists', 'items', 'profiles')
GROUP BY tablename
ORDER BY tablename;

-- Test basic query (this should work with auth)
SELECT 'RLS properly configured' as status; 