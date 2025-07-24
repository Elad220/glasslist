-- Function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to get user analytics data
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  analytics JSON;
BEGIN
  SELECT json_build_object(
    'total_lists', (
      SELECT COUNT(*) FROM shopping_lists 
      WHERE user_id = user_uuid AND is_archived = false
    ),
    'total_items', (
      SELECT COUNT(*) FROM items i
      JOIN shopping_lists sl ON i.list_id = sl.id
      WHERE sl.user_id = user_uuid AND sl.is_archived = false
    ),
    'completed_items', (
      SELECT COUNT(*) FROM items i
      JOIN shopping_lists sl ON i.list_id = sl.id
      WHERE sl.user_id = user_uuid 
      AND sl.is_archived = false 
      AND i.is_checked = true
    ),
    'items_this_month', (
      SELECT COUNT(*) FROM items i
      JOIN shopping_lists sl ON i.list_id = sl.id
      WHERE sl.user_id = user_uuid 
      AND i.created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'most_frequent_category', (
      SELECT category FROM items i
      JOIN shopping_lists sl ON i.list_id = sl.id
      WHERE sl.user_id = user_uuid
      GROUP BY category
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'most_frequent_items', (
      SELECT json_agg(
        json_build_object('name', name, 'count', item_count)
        ORDER BY item_count DESC
      ) FROM (
        SELECT i.name, COUNT(*) as item_count
        FROM items i
        JOIN shopping_lists sl ON i.list_id = sl.id
        WHERE sl.user_id = user_uuid
        GROUP BY i.name
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) frequent_items
    )
  ) INTO analytics;
  
  RETURN analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search items by name (for AI suggestions)
CREATE OR REPLACE FUNCTION search_user_items(
  user_uuid UUID,
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  name TEXT,
  category TEXT,
  unit unit_type,
  frequency BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.name,
    i.category,
    i.unit,
    COUNT(*) as frequency
  FROM items i
  JOIN shopping_lists sl ON i.list_id = sl.id
  WHERE sl.user_id = user_uuid
  AND i.name ILIKE '%' || search_term || '%'
  GROUP BY i.name, i.category, i.unit
  ORDER BY COUNT(*) DESC, i.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 