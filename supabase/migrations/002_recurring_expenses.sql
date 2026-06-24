-- Recurring Expenses: auto-generate monthly recurring costs
CREATE TABLE recurring_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for recurring_expenses" ON recurring_expenses FOR ALL USING (true);

CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed some common recurring expenses
INSERT INTO recurring_expenses (category, description, amount, day_of_month) VALUES
  ('Salary', 'Security Guard', 8000, 1),
  ('Salary', 'Cleaning Staff', 5000, 1),
  ('Maintenance', 'Building Insurance (monthly)', 2500, 1);
