-- Create test data for testing the application
-- Run this AFTER fix_rls_properly.sql and ensure_all_tables.sql
-- IMPORTANT: You must be authenticated in Supabase when running this

-- =============================================
-- GET YOUR USER ID FIRST
-- =============================================

-- Run this first to get your user ID:
SELECT 
    auth.uid() as your_user_id,
    'Copy this user ID for the next step' as instruction;

-- =============================================
-- CREATE TEST SHOPPING LIST
-- =============================================

-- Replace 'your-user-id' with the ID from above
INSERT INTO public.shopping_lists (user_id, name, description, is_shared, share_code)
VALUES (
    auth.uid(),  -- This will use your current authenticated user
    'Weekly Groceries',
    'Regular weekly shopping items',
    TRUE,
    'DEMO1234'
) ON CONFLICT DO NOTHING;

-- Get the list ID we just created
SELECT 
    id as list_id,
    name,
    'Use this list_id for creating items' as instruction
FROM public.shopping_lists 
WHERE user_id = auth.uid() 
AND name = 'Weekly Groceries';

-- =============================================
-- CREATE TEST ITEMS
-- =============================================

-- This will create items for the list we just created
INSERT INTO public.items (list_id, name, amount, unit, category, notes, is_checked)
SELECT 
    sl.id,
    item_data.name,
    item_data.amount,
    item_data.unit,
    item_data.category,
    item_data.notes,
    item_data.is_checked
FROM public.shopping_lists sl,
(VALUES 
    ('Milk', 1, 'gallon', 'Dairy', 'Organic preferred', FALSE),
    ('Bread', 2, 'loaf', 'Bakery', NULL, TRUE),
    ('Apples', 6, 'piece', 'Produce', 'Honeycrisp', FALSE),
    ('Bananas', 1, 'bunch', 'Produce', NULL, FALSE),
    ('Chicken Breast', 2, 'lb', 'Meat', 'Free range', TRUE),
    ('Eggs', 1, 'dozen', 'Dairy', NULL, FALSE)
) AS item_data(name, amount, unit, category, notes, is_checked)
WHERE sl.user_id = auth.uid() 
AND sl.name = 'Weekly Groceries'
ON CONFLICT DO NOTHING;

-- =============================================
-- CREATE SECOND TEST LIST
-- =============================================

INSERT INTO public.shopping_lists (user_id, name, description, is_shared)
VALUES (
    auth.uid(),
    'Party Supplies',
    'Items for weekend party',
    FALSE
) ON CONFLICT DO NOTHING;

-- Add items to party list
INSERT INTO public.items (list_id, name, amount, unit, category, is_checked)
SELECT 
    sl.id,
    item_data.name,
    item_data.amount,
    item_data.unit,
    item_data.category,
    item_data.is_checked
FROM public.shopping_lists sl,
(VALUES 
    ('Paper Plates', 1, 'pack', 'Party', FALSE),
    ('Napkins', 2, 'pack', 'Party', FALSE),
    ('Chips', 3, 'bag', 'Snacks', TRUE),
    ('Sodas', 2, 'pack', 'Beverages', FALSE)
) AS item_data(name, amount, unit, category, is_checked)
WHERE sl.user_id = auth.uid() 
AND sl.name = 'Party Supplies'
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFY TEST DATA CREATED
-- =============================================

SELECT 
    'Test data created successfully!' as status,
    COUNT(*) as lists_created
FROM public.shopping_lists 
WHERE user_id = auth.uid();

SELECT 
    sl.name as list_name,
    COUNT(i.id) as item_count
FROM public.shopping_lists sl
LEFT JOIN public.items i ON sl.id = i.list_id
WHERE sl.user_id = auth.uid()
GROUP BY sl.id, sl.name
ORDER BY sl.created_at; 