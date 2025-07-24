-- Restore proper security for GlassList
-- This will re-enable RLS and create proper policies

-- =============================================
-- CLEAN UP DEBUGGING CHANGES
-- =============================================

-- Remove all debugging policies
DROP POLICY IF EXISTS "Allow all authenticated users (DEBUG)" ON public.shopping_lists;

-- =============================================
-- RE-ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SHOPPING LISTS POLICIES
-- =============================================

-- Users can insert their own lists
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.shopping_lists;
CREATE POLICY "Users can insert their own lists" ON public.shopping_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own lists OR lists they're members of
DROP POLICY IF EXISTS "Users can view accessible lists" ON public.shopping_lists;
CREATE POLICY "Users can view accessible lists" ON public.shopping_lists
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.list_members lm
            WHERE lm.list_id = shopping_lists.id
            AND lm.user_id = auth.uid()
        )
    );

-- Users can update their own lists OR lists where they have owner/editor role
DROP POLICY IF EXISTS "Users can update accessible lists" ON public.shopping_lists;
CREATE POLICY "Users can update accessible lists" ON public.shopping_lists
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.list_members lm
            WHERE lm.list_id = shopping_lists.id
            AND lm.user_id = auth.uid()
            AND lm.role IN ('owner', 'editor')
        )
    );

-- Users can delete their own lists
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.shopping_lists;
CREATE POLICY "Users can delete their own lists" ON public.shopping_lists
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ITEMS POLICIES
-- =============================================

-- Users can insert items to lists they have access to
DROP POLICY IF EXISTS "Users can insert items to accessible lists" ON public.items;
CREATE POLICY "Users can insert items to accessible lists" ON public.items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            LEFT JOIN public.list_members lm ON sl.id = lm.list_id
            WHERE sl.id = items.list_id
            AND (
                sl.user_id = auth.uid() OR
                (lm.user_id = auth.uid() AND lm.role IN ('owner', 'editor'))
            )
        )
    );

-- Users can view items from lists they have access to
DROP POLICY IF EXISTS "Users can view items from accessible lists" ON public.items;
CREATE POLICY "Users can view items from accessible lists" ON public.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            LEFT JOIN public.list_members lm ON sl.id = lm.list_id
            WHERE sl.id = items.list_id
            AND (
                sl.user_id = auth.uid() OR
                lm.user_id = auth.uid()
            )
        )
    );

-- Users can update items in lists they have editor access to
DROP POLICY IF EXISTS "Users can update items in accessible lists" ON public.items;
CREATE POLICY "Users can update items in accessible lists" ON public.items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            LEFT JOIN public.list_members lm ON sl.id = lm.list_id
            WHERE sl.id = items.list_id
            AND (
                sl.user_id = auth.uid() OR
                (lm.user_id = auth.uid() AND lm.role IN ('owner', 'editor'))
            )
        )
    );

-- Users can delete items from lists they have editor access to
DROP POLICY IF EXISTS "Users can delete items from accessible lists" ON public.items;
CREATE POLICY "Users can delete items from accessible lists" ON public.items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            LEFT JOIN public.list_members lm ON sl.id = lm.list_id
            WHERE sl.id = items.list_id
            AND (
                sl.user_id = auth.uid() OR
                (lm.user_id = auth.uid() AND lm.role IN ('owner', 'editor'))
            )
        )
    );

-- =============================================
-- LIST MEMBERS POLICIES
-- =============================================

-- Users can view memberships for lists they have access to
DROP POLICY IF EXISTS "Users can view list memberships" ON public.list_members;
CREATE POLICY "Users can view list memberships" ON public.list_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_members.list_id
            AND sl.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.list_members lm
            WHERE lm.list_id = list_members.list_id
            AND lm.user_id = auth.uid()
        )
    );

-- List owners can add new members
DROP POLICY IF EXISTS "List owners can add members" ON public.list_members;
CREATE POLICY "List owners can add members" ON public.list_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_members.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- List owners can update member roles
DROP POLICY IF EXISTS "List owners can update members" ON public.list_members;
CREATE POLICY "List owners can update members" ON public.list_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_members.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- List owners and the members themselves can remove memberships
DROP POLICY IF EXISTS "Users can remove memberships" ON public.list_members;
CREATE POLICY "Users can remove memberships" ON public.list_members
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_members.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- =============================================
-- LIST INVITATIONS POLICIES
-- =============================================

-- List owners can view invitations
DROP POLICY IF EXISTS "List owners can view invitations" ON public.list_invitations;
CREATE POLICY "List owners can view invitations" ON public.list_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_invitations.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- List owners can create invitations
DROP POLICY IF EXISTS "List owners can create invitations" ON public.list_invitations;
CREATE POLICY "List owners can create invitations" ON public.list_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_invitations.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- List owners can update invitations
DROP POLICY IF EXISTS "List owners can update invitations" ON public.list_invitations;
CREATE POLICY "List owners can update invitations" ON public.list_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_invitations.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- List owners can delete invitations
DROP POLICY IF EXISTS "List owners can delete invitations" ON public.list_invitations;
CREATE POLICY "List owners can delete invitations" ON public.list_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_invitations.list_id
            AND sl.user_id = auth.uid()
        )
    );

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- =============================================
-- VERIFY SECURITY IS RESTORED
-- =============================================

-- Check that RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('shopping_lists', 'items', 'list_members', 'list_invitations', 'profiles')
ORDER BY tablename;

-- Count policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
