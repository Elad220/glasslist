-- Remove sharing functionality from GlassList
-- This migration removes all sharing-related tables, columns, functions, and triggers

-- Drop triggers first
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON shopping_lists;

-- Drop functions
DROP FUNCTION IF EXISTS create_list_owner_membership();
DROP FUNCTION IF EXISTS join_list_by_share_code(VARCHAR(10));
DROP FUNCTION IF EXISTS get_user_list_permission(UUID);
DROP FUNCTION IF EXISTS generate_share_code(INTEGER);
DROP FUNCTION IF EXISTS generate_share_code();
DROP FUNCTION IF EXISTS user_has_list_permission(UUID, VARCHAR, UUID);
DROP FUNCTION IF EXISTS log_list_activity(UUID, UUID, VARCHAR, UUID, UUID, JSON, JSON, VARCHAR);

-- Drop RLS policies before dropping tables
DROP POLICY IF EXISTS "Users can view list members for lists they have access to" ON list_members;
DROP POLICY IF EXISTS "List owners can manage members" ON list_members;
DROP POLICY IF EXISTS "Users can view invitations for lists they own" ON list_invitations;
DROP POLICY IF EXISTS "List owners can manage invitations" ON list_invitations;

-- Drop additional RLS policies from 06_rls_policies.sql
DROP POLICY IF EXISTS "Users can view list memberships" ON public.list_members;
DROP POLICY IF EXISTS "List owners can add members" ON public.list_members;
DROP POLICY IF EXISTS "List owners can update members" ON public.list_members;
DROP POLICY IF EXISTS "Users can remove memberships" ON public.list_members;
DROP POLICY IF EXISTS "List owners can view invitations" ON public.list_invitations;
DROP POLICY IF EXISTS "List owners can create invitations" ON public.list_invitations;
DROP POLICY IF EXISTS "List owners can update invitations" ON public.list_invitations;
DROP POLICY IF EXISTS "List owners can delete invitations" ON public.list_invitations;

-- Drop additional sharing-related tables if they exist
DROP TABLE IF EXISTS list_invitations_v2 CASCADE;
DROP TABLE IF EXISTS list_activity_log CASCADE;
DROP TABLE IF EXISTS list_member_permissions CASCADE;
DROP TABLE IF EXISTS list_presence CASCADE;
DROP TABLE IF EXISTS list_sharing_settings CASCADE;

-- Drop original sharing tables
DROP TABLE IF EXISTS list_invitations CASCADE;
DROP TABLE IF EXISTS list_members CASCADE;

-- Remove sharing columns from shopping_lists table
ALTER TABLE shopping_lists 
DROP COLUMN IF EXISTS is_shared,
DROP COLUMN IF EXISTS share_code,
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS sharing_enabled,
DROP COLUMN IF EXISTS member_count;

-- Drop indexes if they still exist
DROP INDEX IF EXISTS idx_list_members_list_id;
DROP INDEX IF EXISTS idx_list_members_user_id;
DROP INDEX IF EXISTS idx_list_invitations_list_id;
DROP INDEX IF EXISTS idx_list_invitations_email;
DROP INDEX IF EXISTS idx_list_invitations_share_code;

-- Clean up any other sharing-related indexes
DROP INDEX IF EXISTS idx_list_activity_log_list_id;
DROP INDEX IF EXISTS idx_list_activity_log_user_id;
DROP INDEX IF EXISTS idx_list_presence_list_id;
DROP INDEX IF EXISTS idx_list_presence_user_id;

-- Regenerate TypeScript types after this migration
-- Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts