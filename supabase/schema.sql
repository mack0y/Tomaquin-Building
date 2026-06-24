-- ============================================
-- Tomaquin Building Management System
-- Supabase Schema
-- ============================================

-- Enums
CREATE TYPE unit_status AS ENUM ('occupied', 'vacant', 'maintenance');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue', 'partial');
CREATE TYPE utility_type AS ENUM ('electric', 'water');

-- ============================================
-- Units Table
-- ============================================
CREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_number TEXT NOT NULL UNIQUE,
  floor INTEGER NOT NULL CHECK (floor >= 1 AND floor <= 10),
  rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status unit_status NOT NULL DEFAULT 'vacant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tenants Table
-- ============================================
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Rent Payments Table
-- ============================================
CREATE TABLE rent_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2020 AND period_year <= 2100),
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Utility Readings Table
-- ============================================
CREATE TABLE utility_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  utility_type utility_type NOT NULL,
  previous_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_reading DECIMAL(10,2) NOT NULL DEFAULT 0,
  rate_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS ((current_reading - previous_reading) * rate_per_unit) STORED,
  reading_date DATE NOT NULL,
  billing_period_month INTEGER NOT NULL CHECK (billing_period_month >= 1 AND billing_period_month <= 12),
  billing_period_year INTEGER NOT NULL CHECK (billing_period_year >= 2020 AND billing_period_year <= 2100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Expenses Table
-- ============================================
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_tenants_unit_id ON tenants(unit_id);
CREATE INDEX idx_rent_payments_tenant_id ON rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_unit_id ON rent_payments(unit_id);
CREATE INDEX idx_rent_payments_period ON rent_payments(period_year, period_month);
CREATE INDEX idx_utility_readings_unit_id ON utility_readings(unit_id);
CREATE INDEX idx_utility_readings_period ON utility_readings(billing_period_year, billing_period_month);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (disabled for now, ready for auth later)
-- ============================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth)
CREATE POLICY "Allow all for units" ON units FOR ALL USING (true);
CREATE POLICY "Allow all for tenants" ON tenants FOR ALL USING (true);
CREATE POLICY "Allow all for rent_payments" ON rent_payments FOR ALL USING (true);
CREATE POLICY "Allow all for utility_readings" ON utility_readings FOR ALL USING (true);
CREATE POLICY "Allow all for expenses" ON expenses FOR ALL USING (true);

-- ============================================
-- Seed Data: Default 3 floors, 4 units each
-- ============================================
INSERT INTO units (unit_number, floor, rent_amount, status) VALUES
  ('101', 1, 5000, 'occupied'),
  ('102', 1, 5000, 'occupied'),
  ('103', 1, 5000, 'vacant'),
  ('104', 1, 5000, 'occupied'),
  ('201', 2, 5500, 'occupied'),
  ('202', 2, 5500, 'vacant'),
  ('203', 2, 5500, 'occupied'),
  ('204', 2, 5500, 'occupied'),
  ('301', 3, 6000, 'occupied'),
  ('302', 3, 6000, 'occupied'),
  ('303', 3, 6000, 'vacant'),
  ('304', 3, 6000, 'occupied');
