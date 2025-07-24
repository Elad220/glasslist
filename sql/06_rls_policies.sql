-- Row Level Security Policies for GlassList
-- This enables authenticated users to access only their own data
-- Uses DROP IF EXISTS to safely replace existing policies

-- =============================================
-- SHOPPING LISTS POLICIES
-- =============================================

-- Enable RLS on shopping_lists table
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can insert their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can view their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON public.shopping_lists;

-- TEMPORARY: Very permissive policy for debugging
DROP POLICY IF EXISTS "Allow all authenticated users (DEBUG)" ON public.shopping_lists;
CREATE POLICY "Allow all authenticated users (DEBUG)" ON public.shopping_lists
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Uncomment these once debugging is complete:
-- CREATE POLICY "Users can insert their own lists" ON public.shopping_lists
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can view their own lists" ON public.shopping_lists
--     FOR SELECT USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can update their own lists" ON public.shopping_lists
--     FOR UPDATE USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete their own lists" ON public.shopping_lists
--     FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ITEMS POLICIES (keeping original for now)
-- =============================================

-- Enable RLS on items table
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can insert items to their own lists" ON public.items;
CREATE POLICY "Users can insert items to their own lists" ON public.items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view items from their own lists" ON public.items;
CREATE POLICY "Users can view items from their own lists" ON public.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update items in their own lists" ON public.items;
CREATE POLICY "Users can update items in their own lists" ON public.items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete items from their own lists" ON public.items;
CREATE POLICY "Users can delete items from their own lists" ON public.items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- =============================================
-- LIST MEMBERS POLICIES (for shared lists)
-- =============================================

-- Enable RLS on list_members table
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view list memberships" ON public.list_members;
CREATE POLICY "Users can view list memberships" ON public.list_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_members.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "List owners can add members" ON public.list_members;
CREATE POLICY "List owners can add members" ON public.list_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_members.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "List owners can update members" ON public.list_members;
CREATE POLICY "List owners can update members" ON public.list_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_members.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can remove memberships" ON public.list_members;
CREATE POLICY "Users can remove memberships" ON public.list_members
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_members.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- =============================================
-- LIST INVITATIONS POLICIES
-- =============================================

-- Enable RLS on list_invitations table
ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "List owners can view invitations" ON public.list_invitations;
CREATE POLICY "List owners can view invitations" ON public.list_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_invitations.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "List owners can create invitations" ON public.list_invitations;
CREATE POLICY "List owners can create invitations" ON public.list_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_invitations.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "List owners can update invitations" ON public.list_invitations;
CREATE POLICY "List owners can update invitations" ON public.list_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_invitations.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "List owners can delete invitations" ON public.list_invitations;
CREATE POLICY "List owners can delete invitations" ON public.list_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = list_invitations.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id); 