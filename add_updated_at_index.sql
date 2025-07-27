-- Add index for updated_at field to optimize sorting by usage
CREATE INDEX idx_shopping_lists_updated_at ON shopping_lists(updated_at DESC);

-- Optional: Add a composite index for user_id + updated_at for even better performance
-- This will optimize queries that filter by user_id and sort by updated_at
CREATE INDEX idx_shopping_lists_user_updated ON shopping_lists(user_id, updated_at DESC);