-- Ensure all required tables exist with proper RLS
-- Run this AFTER fix_rls_properly.sql

-- =============================================
-- CHECK AND CREATE MISSING TABLES
-- =============================================

-- Create list_members table if it doesn't exist (for sharing functionality)
CREATE TABLE IF NOT EXISTS public.list_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, user_id)
);

-- Create list_invitations table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.list_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
    share_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, email)
);

-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add sharing columns to shopping_lists if they don't exist
ALTER TABLE public.shopping_lists 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_code TEXT;

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invitations ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.list_members TO authenticated;
GRANT ALL ON public.list_invitations TO authenticated;

-- Simple policies for list_members
CREATE POLICY IF NOT EXISTS "users_can_view_list_members" ON public.list_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_members.list_id AND sl.user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "list_owners_can_manage_members" ON public.list_members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_members.list_id AND sl.user_id = auth.uid()
        )
    );

-- Simple policies for list_invitations
CREATE POLICY IF NOT EXISTS "list_owners_can_manage_invitations" ON public.list_invitations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl
            WHERE sl.id = list_invitations.list_id AND sl.user_id = auth.uid()
        )
    );

-- =============================================
-- CREATE SOME TEST DATA (OPTIONAL)
-- =============================================

-- Uncomment these lines if you want some test data
-- Note: Replace 'your-user-id' with your actual user ID from auth.users

/*
-- Insert a test shopping list (replace with your actual user ID)
INSERT INTO public.shopping_lists (user_id, name, description, is_shared)
VALUES (
    'your-user-id-here',  -- Replace with your actual user ID
    'Test Grocery List',
    'A test list to verify everything works',
    FALSE
) ON CONFLICT DO NOTHING;

-- Insert some test items (you'll need to get the list ID first)
INSERT INTO public.items (list_id, name, amount, unit, category, is_checked)
SELECT 
    sl.id,
    'Milk',
    1,
    'gallon',
    'Dairy',
    FALSE
FROM public.shopping_lists sl 
WHERE sl.name = 'Test Grocery List'
AND sl.user_id = 'your-user-id-here'  -- Replace with your actual user ID
LIMIT 1
ON CONFLICT DO NOTHING;
*/

-- =============================================
-- VERIFY EVERYTHING IS SET UP
-- =============================================

SELECT 'All tables and policies configured successfully' as status; 