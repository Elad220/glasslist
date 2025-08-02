-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('shopping_lists', 'items')
AND schemaname = 'public';

-- Check RLS policies on shopping_lists
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polroles::regrole[] as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'shopping_lists';

-- Check RLS policies on items
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polroles::regrole[] as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'items';

-- Test with service role (bypasses RLS) - only use in SQL editor, not in app!
-- This will show all data regardless of RLS policies
SELECT 
    'Total shopping lists' as metric,
    COUNT(*) as count
FROM shopping_lists
UNION ALL
SELECT 
    'Total items' as metric,
    COUNT(*) as count
FROM items
UNION ALL
SELECT 
    'Lists with items' as metric,
    COUNT(DISTINCT sl.id) as count
FROM shopping_lists sl
JOIN items i ON i.list_id = sl.id;