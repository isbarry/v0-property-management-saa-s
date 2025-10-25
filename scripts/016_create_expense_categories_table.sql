-- Create expense categories table for dynamic category management
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Insert default categories for all existing users
INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'maintenance', 'Maintenance', '#EF4444', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'utilities', 'Utilities', '#F59E0B', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'insurance', 'Insurance', '#3B82F6', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'taxes', 'Taxes', '#8B5CF6', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'management_fees', 'Management Fees', '#10B981', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'repairs', 'Repairs', '#F97316', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'cleaning', 'Cleaning', '#06B6D4', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'supplies', 'Supplies', '#84CC16', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'marketing', 'Marketing', '#EC4899', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'legal', 'Legal', '#6366F1', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO expense_categories (user_id, name, display_name, color, is_default)
SELECT DISTINCT user_id, 'other', 'Other', '#6B7280', TRUE FROM neon_auth.users_sync
ON CONFLICT (user_id, name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Remove the CHECK constraint from expenses table to allow custom categories
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
