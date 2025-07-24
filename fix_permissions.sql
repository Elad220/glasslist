-- Fix PostgreSQL table permissions for Supabase roles
-- This grants the necessary permissions to anon and authenticated roles

-- Grant all permissions on tables to both anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on sequences (needed for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;

-- Verify permissions
SELECT 'shopping_lists permissions:' as info;
SELECT grantee, privilege_type 
FROM information_schema.table_privileges
WHERE table_name = 'shopping_lists'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
