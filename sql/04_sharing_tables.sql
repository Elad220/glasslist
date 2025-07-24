-- Add sharing functionality to GlassList
-- This file adds tables for list sharing, permissions, and invitations

-- Add sharing fields to shopping_lists table
ALTER TABLE shopping_lists 
ADD COLUMN is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN share_code VARCHAR(10) UNIQUE,
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create list_members table for managing list access
CREATE TABLE list_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Create invitations table for pending list invitations
CREATE TABLE list_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  share_code VARCHAR(10),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, email)
);

-- Create indexes for better performance
CREATE INDEX idx_list_members_list_id ON list_members(list_id);
CREATE INDEX idx_list_members_user_id ON list_members(user_id);
CREATE INDEX idx_list_invitations_list_id ON list_invitations(list_id);
CREATE INDEX idx_list_invitations_email ON list_invitations(email);
CREATE INDEX idx_list_invitations_share_code ON list_invitations(share_code);

-- Enable RLS on new tables
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list_members
CREATE POLICY "Users can view list members for lists they have access to" ON list_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM list_members lm 
      WHERE lm.list_id = list_members.list_id 
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "List owners can manage members" ON list_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM list_members lm 
      WHERE lm.list_id = list_members.list_id 
      AND lm.user_id = auth.uid() 
      AND lm.role = 'owner'
    )
  );

-- RLS Policies for list_invitations  
CREATE POLICY "Users can view invitations for lists they own" ON list_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM list_members lm 
      WHERE lm.list_id = list_invitations.list_id 
      AND lm.user_id = auth.uid() 
      AND lm.role = 'owner'
    )
  );

CREATE POLICY "List owners can manage invitations" ON list_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM list_members lm 
      WHERE lm.list_id = list_invitations.list_id 
      AND lm.user_id = auth.uid() 
      AND lm.role = 'owner'
    )
  );

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  code VARCHAR(10);
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM shopping_lists WHERE share_code = code
      UNION
      SELECT 1 FROM list_invitations WHERE share_code = code
    ) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create list membership for list creator
CREATE OR REPLACE FUNCTION create_list_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the list creator as owner
  INSERT INTO list_members (list_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id);
  
  -- Set created_by field
  NEW.created_by = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create owner membership
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON shopping_lists;
CREATE TRIGGER create_owner_membership_trigger
  BEFORE INSERT ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION create_list_owner_membership();

-- Function to join a list via share code
CREATE OR REPLACE FUNCTION join_list_by_share_code(share_code_input VARCHAR(10))
RETURNS JSON AS $$
DECLARE
  target_list shopping_lists%ROWTYPE;
  existing_member list_members%ROWTYPE;
  new_member_id UUID;
BEGIN
  -- Find the list by share code
  SELECT * INTO target_list 
  FROM shopping_lists 
  WHERE share_code = share_code_input AND is_shared = TRUE;
  
  IF target_list.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid share code');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_member 
  FROM list_members 
  WHERE list_id = target_list.id AND user_id = auth.uid();
  
  IF existing_member.id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already a member of this list');
  END IF;
  
  -- Add user as member
  INSERT INTO list_members (list_id, user_id, role)
  VALUES (target_list.id, auth.uid(), 'editor')
  RETURNING id INTO new_member_id;
  
  RETURN json_build_object(
    'success', true, 
    'list_id', target_list.id,
    'list_name', target_list.name,
    'member_id', new_member_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's list permissions
CREATE OR REPLACE FUNCTION get_user_list_permission(list_id_input UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  user_role VARCHAR(20);
BEGIN
  SELECT role INTO user_role
  FROM list_members 
  WHERE list_id = list_id_input AND user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 