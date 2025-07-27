-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE unit_type AS ENUM (
  'pcs', 'kg', 'g', 'L', 'ml', 'pack', 'dozen', 'box', 'jar', 'bottle', 
  'can', 'bag', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'head', 'slice'
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  gemini_api_key TEXT, -- Encrypted storage for user's personal API key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shopping lists table
CREATE TABLE shopping_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  category_order JSONB DEFAULT '[]'::jsonb, -- Store ordered array of category names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Items table
CREATE TABLE items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) DEFAULT 1,
  unit unit_type DEFAULT 'pcs',
  category TEXT DEFAULT 'General', -- Aisle/category like 'Produce', 'Dairy', 'Bakery'
  notes TEXT,
  image_url TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0, -- For custom ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_created_at ON shopping_lists(created_at DESC);
CREATE INDEX idx_shopping_lists_updated_at ON shopping_lists(updated_at DESC);
CREATE INDEX idx_shopping_lists_user_updated ON shopping_lists(user_id, updated_at DESC);
CREATE INDEX idx_items_list_id ON items(list_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_is_checked ON items(is_checked);
CREATE INDEX idx_items_position ON items(position);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_shopping_lists
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_items
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp(); 