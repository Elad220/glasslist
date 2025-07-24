-- Safe migration to fix unit values
-- Run this in Supabase SQL Editor with caution

-- First, let's temporarily disable RLS to ensure we can update
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;

-- Check current unit values before fixing
SELECT 'BEFORE UPDATE' as status, unit, COUNT(*) as count
FROM public.items
GROUP BY unit
ORDER BY count DESC;

-- Fix invalid unit values one by one with error handling
DO $$
BEGIN
    -- Update 'piece' to 'pcs'
    BEGIN
        UPDATE public.items SET unit = 'pcs' WHERE unit = 'piece';
        RAISE NOTICE 'Updated % rows: piece -> pcs', ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating piece to pcs: %', SQLERRM;
    END;

    -- Update 'liter' to 'L'
    BEGIN
        UPDATE public.items SET unit = 'L' WHERE unit = 'liter';
        RAISE NOTICE 'Updated % rows: liter -> L', ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating liter to L: %', SQLERRM;
    END;

    -- Update 'package' to 'pack'
    BEGIN
        UPDATE public.items SET unit = 'pack' WHERE unit = 'package';
        RAISE NOTICE 'Updated % rows: package -> pack', ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating package to pack: %', SQLERRM;
    END;

    -- Update 'gallon' to 'L' (closest equivalent)
    BEGIN
        UPDATE public.items SET unit = 'L' WHERE unit = 'gallon';
        RAISE NOTICE 'Updated % rows: gallon -> L', ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating gallon to L: %', SQLERRM;
    END;
END $$;

-- Check unit values after fixing
SELECT 'AFTER UPDATE' as status, unit, COUNT(*) as count
FROM public.items
GROUP BY unit
ORDER BY count DESC;

-- Re-enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY; 