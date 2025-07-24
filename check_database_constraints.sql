-- Debug 400 error on item creation
-- Run this in Supabase SQL Editor to find the issue

-- =============================================
-- CHECK ITEMS TABLE STRUCTURE
-- =============================================

-- 1. Check if items table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'items'
ORDER BY ordinal_position;

-- 2. Check constraints on items table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.items'::regclass;

-- 3. Check if unit_type enum exists and its values
SELECT 
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'unit_type'
ORDER BY e.enumsortorder;

-- 4. Test a simple INSERT (replace values as needed)
-- This should help identify what's failing
/*
INSERT INTO public.items (
    list_id, 
    name, 
    amount, 
    unit, 
    category, 
    notes, 
    is_checked
) VALUES (
    'test-list-id',  -- Replace with a real list ID
    'Test Item',
    1,
    'pcs',
    'Other',
    null,
    false
);
*/

-- 5. Check if there are any triggers on items table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'items'
AND event_object_schema = 'public';

-- 6. Check current user permissions on items
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'items'
AND table_schema = 'public'
AND grantee IN ('authenticated', 'anon', current_user);

-- 7. Get a real list ID to test with
SELECT 
    id as list_id,
    name,
    user_id,
    'Use this list_id for testing item creation' as instruction
FROM public.shopping_lists 
LIMIT 3; 