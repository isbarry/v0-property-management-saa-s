-- Financial tables for payments, expenses, and transactions

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')),
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('rent', 'deposit', 'utility', 'maintenance', 'other')),
  transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('maintenance', 'utilities', 'insurance', 'taxes', 'management_fees', 'repairs', 'cleaning', 'supplies', 'marketing', 'legal', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  vendor VARCHAR(255),
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')),
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for financial tables
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- Apply updated_at triggers
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
