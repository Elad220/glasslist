-- Fix invalid unit values in items table
-- This migration updates any items with incorrect unit values to match the unit_type enum

-- Check current invalid units (for reference)
SELECT DISTINCT unit, COUNT(*) 
FROM items 
WHERE unit NOT IN (
  'pcs', 'kg', 'g', 'L', 'ml', 'pack', 'dozen', 'box', 'jar', 'bottle', 
  'can', 'bag', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'head', 'slice'
)
GROUP BY unit;

-- Update invalid unit values to valid ones
UPDATE items SET unit = 'pcs' WHERE unit = 'piece';
UPDATE items SET unit = 'L' WHERE unit = 'liter';
UPDATE items SET unit = 'pack' WHERE unit = 'package';

-- Verify no invalid units remain
SELECT DISTINCT unit 
FROM items 
WHERE unit NOT IN (
  'pcs', 'kg', 'g', 'L', 'ml', 'pack', 'dozen', 'box', 'jar', 'bottle', 
  'can', 'bag', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'head', 'slice'
);

-- If any items still have gallon, we'll need to decide what to map it to
-- For now, let's map gallon to 'L' (liters) as the closest equivalent
UPDATE items SET unit = 'L' WHERE unit = 'gallon'; 