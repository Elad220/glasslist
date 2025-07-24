-- Debug unit column and enum issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if items table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'items';

-- 2. Check the column definition for unit
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'items' 
AND column_name = 'unit';

-- 3. Check what enum values are actually defined
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'unit_type'
);

-- 4. Check current unit values in the table
SELECT unit, COUNT(*) as count
FROM public.items
GROUP BY unit
ORDER BY count DESC;

-- 5. Check if there are any items with 'piece' unit
SELECT id, name, unit 
FROM public.items 
WHERE unit = 'piece'
LIMIT 5;

-- 6. Test if we can manually update one item (replace 'some-item-id' with an actual ID)
-- SELECT id FROM public.items WHERE unit = 'piece' LIMIT 1;
-- UPDATE public.items SET unit = 'pcs' WHERE id = 'actual-item-id-here'; 