-- ============================================
-- Tomaquin Building Management - Test Seed Data
-- Period: January 2026 – June 2026
-- ============================================
-- Run this AFTER the schema and migrations are applied.

-- ============================================
-- 1. TENANTS (9 occupied units)
-- ============================================
-- We insert tenants and capture their IDs with DO blocks.

DO $$
DECLARE
  t_101 UUID; t_102 UUID; t_104 UUID;
  t_201 UUID; t_203 UUID; t_204 UUID;
  t_301 UUID; t_302 UUID; t_304 UUID;
  u_101 UUID; u_102 UUID; u_104 UUID;
  u_201 UUID; u_203 UUID; u_204 UUID;
  u_301 UUID; u_302 UUID; u_304 UUID;
BEGIN
  -- Get unit IDs
  SELECT id INTO u_101 FROM units WHERE unit_number = '101';
  SELECT id INTO u_102 FROM units WHERE unit_number = '102';
  SELECT id INTO u_104 FROM units WHERE unit_number = '104';
  SELECT id INTO u_201 FROM units WHERE unit_number = '201';
  SELECT id INTO u_203 FROM units WHERE unit_number = '203';
  SELECT id INTO u_204 FROM units WHERE unit_number = '204';
  SELECT id INTO u_301 FROM units WHERE unit_number = '301';
  SELECT id INTO u_302 FROM units WHERE unit_number = '302';
  SELECT id INTO u_304 FROM units WHERE unit_number = '304';

  -- Skip if tenants already exist
  IF EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
    RAISE NOTICE 'Tenants already exist, skipping seed data.';
    RETURN;
  END IF;

  -- Insert tenants
  INSERT INTO tenants (full_name, phone, email, unit_id, lease_start, lease_end) VALUES
    ('Juan Dela Cruz',    '09171234567', 'juan@email.com',    u_101, '2026-01-01', '2027-01-01'),
    ('Maria Santos',      '09181234567', 'maria@email.com',   u_102, '2026-01-01', '2026-12-31'),
    ('Pedro Reyes',       '09191234567', 'pedro@email.com',   u_104, '2026-02-01', '2027-02-01'),
    ('Ana Garcia',        '09201234567', 'ana@email.com',     u_201, '2026-01-15', '2027-01-15'),
    ('Luis Mendoza',      '09211234567', 'luis@email.com',    u_203, '2026-01-01', '2026-12-31'),
    ('Carmen Lopez',      '09221234567', 'carmen@email.com',  u_204, '2026-03-01', '2027-03-01'),
    ('Roberto Cruz',      '09231234567', 'roberto@email.com', u_301, '2026-01-01', '2027-06-30'),
    ('Teresa Villanueva', '09241234567', 'teresa@email.com',  u_302, '2026-02-15', '2027-02-15'),
    ('Miguel Bautista',   '09251234567', 'miguel@email.com',  u_304, '2026-01-01', '2027-12-31');

  -- Get tenant IDs
  SELECT id INTO t_101 FROM tenants WHERE full_name = 'Juan Dela Cruz';
  SELECT id INTO t_102 FROM tenants WHERE full_name = 'Maria Santos';
  SELECT id INTO t_104 FROM tenants WHERE full_name = 'Pedro Reyes';
  SELECT id INTO t_201 FROM tenants WHERE full_name = 'Ana Garcia';
  SELECT id INTO t_203 FROM tenants WHERE full_name = 'Luis Mendoza';
  SELECT id INTO t_204 FROM tenants WHERE full_name = 'Carmen Lopez';
  SELECT id INTO t_301 FROM tenants WHERE full_name = 'Roberto Cruz';
  SELECT id INTO t_302 FROM tenants WHERE full_name = 'Teresa Villanueva';
  SELECT id INTO t_304 FROM tenants WHERE full_name = 'Miguel Bautista';

  -- ============================================
  -- 2. RENT PAYMENTS (Jan – Jun 2026)
  -- ============================================
  -- Realistic mix: most paid, some pending, a few overdue

  -- January 2026
  INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status, notes) VALUES
    (t_101, u_101, 5000, '2026-01-03', 1, 2026, 'paid', 'Cash'),
    (t_102, u_102, 5000, '2026-01-05', 1, 2026, 'paid', 'GCash'),
    (t_104, u_104, 5000, '2026-01-04', 1, 2026, 'paid', 'Cash'),
    (t_201, u_201, 5500, '2026-01-06', 1, 2026, 'paid', 'Bank transfer'),
    (t_203, u_203, 5500, '2026-01-03', 1, 2026, 'paid', 'Cash'),
    (t_204, u_204, 5500, '2026-01-05', 1, 2026, 'paid', 'GCash'),
    (t_301, u_301, 6000, '2026-01-02', 1, 2026, 'paid', 'Cash'),
    (t_302, u_302, 6000, '2026-01-07', 1, 2026, 'paid', 'Bank transfer'),
    (t_304, u_304, 6000, '2026-01-04', 1, 2026, 'paid', 'GCash');

  -- February 2026
  INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status, notes) VALUES
    (t_101, u_101, 5000, '2026-02-02', 2, 2026, 'paid', 'Cash'),
    (t_102, u_102, 5000, '2026-02-04', 2, 2026, 'paid', 'GCash'),
    (t_104, u_104, 5000, '2026-02-03', 2, 2026, 'paid', 'Cash'),
    (t_201, u_201, 5500, '2026-02-05', 2, 2026, 'paid', 'Bank transfer'),
    (t_203, u_203, 5500, '2026-02-02', 2, 2026, 'paid', 'Cash'),
    (t_204, u_204, 5500, '2026-02-06', 2, 2026, 'paid', 'GCash'),
    (t_301, u_301, 6000, '2026-02-03', 2, 2026, 'paid', 'Cash'),
    (t_302, u_302, 6000, '2026-02-05', 2, 2026, 'paid', 'Bank transfer'),
    (t_304, u_304, 6000, '2026-02-04', 2, 2026, 'paid', 'GCash');

  -- March 2026
  INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status, notes) VALUES
    (t_101, u_101, 5000, '2026-03-03', 3, 2026, 'paid', 'Cash'),
    (t_102, u_102, 5000, '2026-03-05', 3, 2026, 'paid', 'GCash'),
    (t_104, u_104, 5000, '2026-03-04', 3, 2026, 'paid', 'Cash'),
    (t_201, u_201, 5500, '2026-03-02', 3, 2026, 'paid', 'Bank transfer'),
    (t_203, u_203, 5500, '2026-03-03', 3, 2026, 'overdue', 'Paid late on 2026-03-15'),
    (t_204, u_204, 5500, '2026-03-06', 3, 2026, 'paid', 'GCash'),
    (t_301, u_301, 6000, '2026-03-04', 3, 2026, 'paid', 'Cash'),
    (t_302, u_302, 6000, NULL,         3, 2026, 'pending', 'Tenant traveling'),
    (t_304, u_304, 6000, '2026-03-03', 3, 2026, 'paid', 'GCash');

  -- April 2026
  INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status, notes) VALUES
    (t_101, u_101, 5000, '2026-04-02', 4, 2026, 'paid', 'Cash'),
    (t_102, u_102, 5000, '2026-04-05', 4, 2026, 'paid', 'GCash'),
    (t_104, u_104, 5000, NULL,         4, 2026, 'pending', 'Awaiting remittance'),
    (t_201, u_201, 5500, '2026-04-03', 4, 2026, 'paid', 'Bank transfer'),
    (t_203, u_203, 5500, '2026-04-06', 4, 2026, 'paid', 'Cash'),
    (t_204, u_204, 5500, '2026-04-02', 4, 2026, 'paid', 'GCash'),
    (t_301, u_301, 6000, '2026-04-04', 4, 2026, 'paid', 'Cash'),
    (t_302, u_302, 6000, '2026-04-03', 4, 2026, 'paid', 'Bank transfer'),
    (t_304, u_304, 6000, NULL,         4, 2026, 'overdue', 'Followed up via phone');

  -- May 2026
  INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status, notes) VALUES
    (t_101, u_101, 5000, '2026-05-03', 5, 2026, 'paid', 'Cash'),
    (t_102, u_102, 5000, '2026-05-04', 5, 2026, 'paid', 'GCash'),
    (t_104, u_104, 2500, '2026-05-06', 5, 2026, 'partial', 'Paid half, remainder next week'),
    (t_201, u_201, 5500, '2026-05-02', 5, 2026, 'paid', 'Bank transfer'),
    (t_203, u_203, 5500, '2026-05-05', 5, 2026, 'paid', 'Cash'),
    (t_204, u_204, 5500, '2026-05-03', 5, 2026, 'paid', 'GCash'),
    (t_301, u_301, 6000, '2026-05-04', 5, 2026, 'paid', 'Cash'),
    (t_302, u_302, 6000, '2026-05-02', 5, 2026, 'paid', 'Bank transfer'),
    (t_304, u_304, 6000, '2026-05-05', 5, 2026, 'paid', 'GCash');

  -- June 2026 (current month — most pending/overdue)
  INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status, notes) VALUES
    (t_101, u_101, 5000, '2026-06-03', 6, 2026, 'paid', 'Cash'),
    (t_102, u_102, 5000, NULL,         6, 2026, 'pending', 'Not yet due'),
    (t_104, u_104, 5000, NULL,         6, 2026, 'overdue', 'Still awaiting payment'),
    (t_201, u_201, 5500, '2026-06-02', 6, 2026, 'paid', 'Bank transfer'),
    (t_203, u_203, 5500, NULL,         6, 2026, 'pending', 'Expected end of week'),
    (t_204, u_204, 5500, '2026-06-04', 6, 2026, 'paid', 'GCash'),
    (t_301, u_301, 6000, NULL,         6, 2026, 'pending', 'On travel'),
    (t_302, u_302, 6000, '2026-06-03', 6, 2026, 'paid', 'Bank transfer'),
    (t_304, u_304, 6000, NULL,         6, 2026, 'overdue', 'Sent reminder SMS');

  -- ============================================
  -- 3. UTILITY READINGS (Jan – Jun 2026)
  -- ============================================
  -- Electric: rate ₱12/kWh, Water: rate ₱50/m³
  -- Realistic readings with seasonal variation

  -- January 2026 — Electric
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'electric', 1000, 1250, 12, '2026-01-28', 1, 2026),
    (u_102, 'electric', 800,  1020, 12, '2026-01-28', 1, 2026),
    (u_104, 'electric', 1100, 1380, 12, '2026-01-28', 1, 2026),
    (u_201, 'electric', 950,  1210, 12, '2026-01-28', 1, 2026),
    (u_203, 'electric', 1200, 1490, 12, '2026-01-28', 1, 2026),
    (u_204, 'electric', 880,  1100, 12, '2026-01-28', 1, 2026),
    (u_301, 'electric', 1050, 1340, 12, '2026-01-28', 1, 2026),
    (u_302, 'electric', 750,  980,  12, '2026-01-28', 1, 2026),
    (u_304, 'electric', 1150, 1460, 12, '2026-01-28', 1, 2026);

  -- January 2026 — Water
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'water', 50,  62,  50, '2026-01-28', 1, 2026),
    (u_102, 'water', 40,  51,  50, '2026-01-28', 1, 2026),
    (u_104, 'water', 55,  68,  50, '2026-01-28', 1, 2026),
    (u_201, 'water', 45,  57,  50, '2026-01-28', 1, 2026),
    (u_203, 'water', 60,  75,  50, '2026-01-28', 1, 2026),
    (u_204, 'water', 38,  48,  50, '2026-01-28', 1, 2026),
    (u_301, 'water', 52,  65,  50, '2026-01-28', 1, 2026),
    (u_302, 'water', 35,  45,  50, '2026-01-28', 1, 2026),
    (u_304, 'water', 58,  72,  50, '2026-01-28', 1, 2026);

  -- February 2026 — Electric
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'electric', 1250, 1520, 12, '2026-02-27', 2, 2026),
    (u_102, 'electric', 1020, 1260, 12, '2026-02-27', 2, 2026),
    (u_104, 'electric', 1380, 1690, 12, '2026-02-27', 2, 2026),
    (u_201, 'electric', 1210, 1490, 12, '2026-02-27', 2, 2026),
    (u_203, 'electric', 1490, 1800, 12, '2026-02-27', 2, 2026),
    (u_204, 'electric', 1100, 1350, 12, '2026-02-27', 2, 2026),
    (u_301, 'electric', 1340, 1660, 12, '2026-02-27', 2, 2026),
    (u_302, 'electric', 980,  1230, 12, '2026-02-27', 2, 2026),
    (u_304, 'electric', 1460, 1790, 12, '2026-02-27', 2, 2026);

  -- February 2026 — Water
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'water', 62,  74,  50, '2026-02-27', 2, 2026),
    (u_102, 'water', 51,  63,  50, '2026-02-27', 2, 2026),
    (u_104, 'water', 68,  82,  50, '2026-02-27', 2, 2026),
    (u_201, 'water', 57,  70,  50, '2026-02-27', 2, 2026),
    (u_203, 'water', 75,  90,  50, '2026-02-27', 2, 2026),
    (u_204, 'water', 48,  59,  50, '2026-02-27', 2, 2026),
    (u_301, 'water', 65,  79,  50, '2026-02-27', 2, 2026),
    (u_302, 'water', 45,  56,  50, '2026-02-27', 2, 2026),
    (u_304, 'water', 72,  87,  50, '2026-02-27', 2, 2026);

  -- March 2026 — Electric (summer starting, usage increasing)
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'electric', 1520, 1850, 12, '2026-03-28', 3, 2026),
    (u_102, 'electric', 1260, 1560, 12, '2026-03-28', 3, 2026),
    (u_104, 'electric', 1690, 2060, 12, '2026-03-28', 3, 2026),
    (u_201, 'electric', 1490, 1840, 12, '2026-03-28', 3, 2026),
    (u_203, 'electric', 1800, 2210, 12, '2026-03-28', 3, 2026),
    (u_204, 'electric', 1350, 1660, 12, '2026-03-28', 3, 2026),
    (u_301, 'electric', 1660, 2050, 12, '2026-03-28', 3, 2026),
    (u_302, 'electric', 1230, 1540, 12, '2026-03-28', 3, 2026),
    (u_304, 'electric', 1790, 2190, 12, '2026-03-28', 3, 2026);

  -- March 2026 — Water
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'water', 74,  88,  50, '2026-03-28', 3, 2026),
    (u_102, 'water', 63,  76,  50, '2026-03-28', 3, 2026),
    (u_104, 'water', 82,  98,  50, '2026-03-28', 3, 2026),
    (u_201, 'water', 70,  84,  50, '2026-03-28', 3, 2026),
    (u_203, 'water', 90,  108, 50, '2026-03-28', 3, 2026),
    (u_204, 'water', 59,  71,  50, '2026-03-28', 3, 2026),
    (u_301, 'water', 79,  95,  50, '2026-03-28', 3, 2026),
    (u_302, 'water', 56,  68,  50, '2026-03-28', 3, 2026),
    (u_304, 'water', 87,  104, 50, '2026-03-28', 3, 2026);

  -- April 2026 — Electric (summer peak)
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'electric', 1850, 2240, 12, '2026-04-28', 4, 2026),
    (u_102, 'electric', 1560, 1920, 12, '2026-04-28', 4, 2026),
    (u_104, 'electric', 2060, 2520, 12, '2026-04-28', 4, 2026),
    (u_201, 'electric', 1840, 2270, 12, '2026-04-28', 4, 2026),
    (u_203, 'electric', 2210, 2720, 12, '2026-04-28', 4, 2026),
    (u_204, 'electric', 1660, 2050, 12, '2026-04-28', 4, 2026),
    (u_301, 'electric', 2050, 2530, 12, '2026-04-28', 4, 2026),
    (u_302, 'electric', 1540, 1910, 12, '2026-04-28', 4, 2026),
    (u_304, 'electric', 2190, 2700, 12, '2026-04-28', 4, 2026);

  -- April 2026 — Water
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'water', 88,  105, 50, '2026-04-28', 4, 2026),
    (u_102, 'water', 76,  92,  50, '2026-04-28', 4, 2026),
    (u_104, 'water', 98,  118, 50, '2026-04-28', 4, 2026),
    (u_201, 'water', 84,  101, 50, '2026-04-28', 4, 2026),
    (u_203, 'water', 108, 130, 50, '2026-04-28', 4, 2026),
    (u_204, 'water', 71,  85,  50, '2026-04-28', 4, 2026),
    (u_301, 'water', 95,  114, 50, '2026-04-28', 4, 2026),
    (u_302, 'water', 68,  82,  50, '2026-04-28', 4, 2026),
    (u_304, 'water', 104, 125, 50, '2026-04-28', 4, 2026);

  -- May 2026 — Electric (peak summer)
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'electric', 2240, 2680, 12, '2026-05-28', 5, 2026),
    (u_102, 'electric', 1920, 2350, 12, '2026-05-28', 5, 2026),
    (u_104, 'electric', 2520, 3080, 12, '2026-05-28', 5, 2026),
    (u_201, 'electric', 2270, 2790, 12, '2026-05-28', 5, 2026),
    (u_203, 'electric', 2720, 3340, 12, '2026-05-28', 5, 2026),
    (u_204, 'electric', 2050, 2530, 12, '2026-05-28', 5, 2026),
    (u_301, 'electric', 2530, 3120, 12, '2026-05-28', 5, 2026),
    (u_302, 'electric', 1910, 2360, 12, '2026-05-28', 5, 2026),
    (u_304, 'electric', 2700, 3320, 12, '2026-05-28', 5, 2026);

  -- May 2026 — Water (higher usage in summer)
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'water', 105, 125, 50, '2026-05-28', 5, 2026),
    (u_102, 'water', 92,  112, 50, '2026-05-28', 5, 2026),
    (u_104, 'water', 118, 142, 50, '2026-05-28', 5, 2026),
    (u_201, 'water', 101, 122, 50, '2026-05-28', 5, 2026),
    (u_203, 'water', 130, 158, 50, '2026-05-28', 5, 2026),
    (u_204, 'water', 85,  102, 50, '2026-05-28', 5, 2026),
    (u_301, 'water', 114, 138, 50, '2026-05-28', 5, 2026),
    (u_302, 'water', 82,  99,  50, '2026-05-28', 5, 2026),
    (u_304, 'water', 125, 152, 50, '2026-05-28', 5, 2026);

  -- June 2026 — Electric (peak, partial month)
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'electric', 2680, 3020, 12, '2026-06-20', 6, 2026),
    (u_102, 'electric', 2350, 2680, 12, '2026-06-20', 6, 2026),
    (u_104, 'electric', 3080, 3540, 12, '2026-06-20', 6, 2026),
    (u_201, 'electric', 2790, 3210, 12, '2026-06-20', 6, 2026),
    (u_203, 'electric', 3340, 3890, 12, '2026-06-20', 6, 2026),
    (u_204, 'electric', 2530, 2920, 12, '2026-06-20', 6, 2026),
    (u_301, 'electric', 3120, 3610, 12, '2026-06-20', 6, 2026),
    (u_302, 'electric', 2360, 2740, 12, '2026-06-20', 6, 2026),
    (u_304, 'electric', 3320, 3860, 12, '2026-06-20', 6, 2026);

  -- June 2026 — Water
  INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year) VALUES
    (u_101, 'water', 125, 148, 50, '2026-06-20', 6, 2026),
    (u_102, 'water', 112, 133, 50, '2026-06-20', 6, 2026),
    (u_104, 'water', 142, 170, 50, '2026-06-20', 6, 2026),
    (u_201, 'water', 122, 146, 50, '2026-06-20', 6, 2026),
    (u_203, 'water', 158, 190, 50, '2026-06-20', 6, 2026),
    (u_204, 'water', 102, 122, 50, '2026-06-20', 6, 2026),
    (u_301, 'water', 138, 165, 50, '2026-06-20', 6, 2026),
    (u_302, 'water', 99,  119, 50, '2026-06-20', 6, 2026),
    (u_304, 'water', 152, 182, 50, '2026-06-20', 6, 2026);

  -- ============================================
  -- 4. EXPENSES (Jan – Jun 2026)
  -- ============================================
  -- Mix of categories: Maintenance, Salary, Utilities (Building), Supplies, Insurance, Repair

  -- January 2026
  INSERT INTO expenses (category, description, amount, expense_date) VALUES
    ('Salary',            'Security Guard',              8000,  '2026-01-01'),
    ('Salary',            'Cleaning Staff',              5000,  '2026-01-01'),
    ('Maintenance',       'Building Insurance (monthly)',2500,  '2026-01-01'),
    ('Utilities (Building)', 'Corridor lighting',        3200,  '2026-01-15'),
    ('Supplies',          'Cleaning supplies',           1500,  '2026-01-10'),
    ('Repair',            'Door lock replacement (102)', 800,   '2026-01-20');

  -- February 2026
  INSERT INTO expenses (category, description, amount, expense_date) VALUES
    ('Salary',            'Security Guard',              8000,  '2026-02-01'),
    ('Salary',            'Cleaning Staff',              5000,  '2026-02-01'),
    ('Maintenance',       'Building Insurance (monthly)',2500,  '2026-02-01'),
    ('Utilities (Building)', 'Corridor lighting',        3100,  '2026-02-15'),
    ('Supplies',          'Cleaning supplies',           1200,  '2026-02-08'),
    ('Maintenance',       'Pest control treatment',      2000,  '2026-02-12');

  -- March 2026
  INSERT INTO expenses (category, description, amount, expense_date) VALUES
    ('Salary',            'Security Guard',              8000,  '2026-03-01'),
    ('Salary',            'Cleaning Staff',              5000,  '2026-03-01'),
    ('Maintenance',       'Building Insurance (monthly)',2500,  '2026-03-01'),
    ('Utilities (Building)', 'Corridor lighting',        3500,  '2026-03-15'),
    ('Supplies',          'Cleaning supplies',           1800,  '2026-03-05'),
    ('Repair',            'Water pipe fix (Floor 2)',    3500,  '2026-03-18'),
    ('Tax',               'Quarterly property tax',      15000, '2026-03-31');

  -- April 2026
  INSERT INTO expenses (category, description, amount, expense_date) VALUES
    ('Salary',            'Security Guard',              8000,  '2026-04-01'),
    ('Salary',            'Cleaning Staff',              5000,  '2026-04-01'),
    ('Maintenance',       'Building Insurance (monthly)',2500,  '2026-04-01'),
    ('Utilities (Building)', 'Corridor lighting',        3800,  '2026-04-15'),
    ('Utilities (Building)', 'Elevator maintenance',     4500,  '2026-04-10'),
    ('Supplies',          'Cleaning supplies',           2000,  '2026-04-05'),
    ('Repair',            'Aircon servicing (common area)',5000, '2026-04-20');

  -- May 2026
  INSERT INTO expenses (category, description, amount, expense_date) VALUES
    ('Salary',            'Security Guard',              8500,  '2026-05-01'),
    ('Salary',            'Cleaning Staff',              5000,  '2026-05-01'),
    ('Maintenance',       'Building Insurance (monthly)',2500,  '2026-05-01'),
    ('Utilities (Building)', 'Corridor lighting',        4200,  '2026-05-15'),
    ('Supplies',          'Cleaning supplies',           2200,  '2026-05-08'),
    ('Maintenance',       'Roof waterproofing',          12000, '2026-05-22'),
    ('Other',             'Landscaping/garden upkeep',   3000,  '2026-05-10');

  -- June 2026
  INSERT INTO expenses (category, description, amount, expense_date) VALUES
    ('Salary',            'Security Guard',              8500,  '2026-06-01'),
    ('Salary',            'Cleaning Staff',              5500,  '2026-06-01'),
    ('Maintenance',       'Building Insurance (monthly)',2500,  '2026-06-01'),
    ('Utilities (Building)', 'Corridor lighting',        4500,  '2026-06-15'),
    ('Supplies',          'Cleaning supplies',           1800,  '2026-06-05'),
    ('Repair',            'CCTV camera repair',          6000,  '2026-06-12');

END $$;

-- ============================================
-- Summary of seeded data:
-- - 9 tenants across occupied units
-- - 54 rent payments (Jan–Jun, mix of paid/pending/overdue/partial)
-- - 108 utility readings (9 units × 6 months × 2 types)
-- - 36 expenses across 7 categories
-- - 3 recurring expense templates (already from migration)
-- ============================================
