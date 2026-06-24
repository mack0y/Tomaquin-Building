import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env manually
const envContent = readFileSync('.env', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val.length) env[key.trim()] = val.join('=').trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// Constants
// ============================================
const UNITS = [
  { unit_number: '101', floor: 1, rent_amount: 5000, status: 'occupied' },
  { unit_number: '102', floor: 1, rent_amount: 5000, status: 'occupied' },
  { unit_number: '103', floor: 1, rent_amount: 5000, status: 'vacant' },
  { unit_number: '104', floor: 1, rent_amount: 5000, status: 'occupied' },
  { unit_number: '201', floor: 2, rent_amount: 5500, status: 'occupied' },
  { unit_number: '202', floor: 2, rent_amount: 5500, status: 'vacant' },
  { unit_number: '203', floor: 2, rent_amount: 5500, status: 'occupied' },
  { unit_number: '204', floor: 2, rent_amount: 5500, status: 'occupied' },
  { unit_number: '301', floor: 3, rent_amount: 6000, status: 'occupied' },
  { unit_number: '302', floor: 3, rent_amount: 6000, status: 'occupied' },
  { unit_number: '303', floor: 3, rent_amount: 6000, status: 'vacant' },
  { unit_number: '304', floor: 3, rent_amount: 6000, status: 'occupied' },
]

const TENANTS = [
  { full_name: 'Juan Dela Cruz',    phone: '09171234567', email: 'juan@email.com',    unit_number: '101', lease_start: '2026-01-01', lease_end: '2027-01-01' },
  { full_name: 'Maria Santos',      phone: '09181234567', email: 'maria@email.com',   unit_number: '102', lease_start: '2026-01-01', lease_end: '2026-12-31' },
  { full_name: 'Pedro Reyes',       phone: '09191234567', email: 'pedro@email.com',   unit_number: '104', lease_start: '2026-02-01', lease_end: '2027-02-01' },
  { full_name: 'Ana Garcia',        phone: '09201234567', email: 'ana@email.com',     unit_number: '201', lease_start: '2026-01-15', lease_end: '2027-01-15' },
  { full_name: 'Luis Mendoza',      phone: '09211234567', email: 'luis@email.com',    unit_number: '203', lease_start: '2026-01-01', lease_end: '2026-12-31' },
  { full_name: 'Carmen Lopez',      phone: '09221234567', email: 'carmen@email.com',  unit_number: '204', lease_start: '2026-03-01', lease_end: '2027-03-01' },
  { full_name: 'Roberto Cruz',      phone: '09231234567', email: 'roberto@email.com', unit_number: '301', lease_start: '2026-01-01', lease_end: '2027-06-30' },
  { full_name: 'Teresa Villanueva', phone: '09241234567', email: 'teresa@email.com',  unit_number: '302', lease_start: '2026-02-15', lease_end: '2027-02-15' },
  { full_name: 'Miguel Bautista',   phone: '09251234567', email: 'miguel@email.com',  unit_number: '304', lease_start: '2026-01-01', lease_end: '2027-12-31' },
]

// Unit map: unit_number -> { id, ... }
let unitMap = {}

// ============================================
// Step 1: Fetch existing units
// ============================================
async function fetchUnits() {
  const { data, error } = await supabase.from('units').select('id, unit_number')
  if (error) throw new Error('Failed to fetch units: ' + error.message)
  data.forEach(u => { unitMap[u.unit_number] = u.id })
  console.log(`✓ Fetched ${data.length} units`)
}

// ============================================
// Step 2: Check if data already exists
// ============================================
async function checkExisting() {
  const { data, error } = await supabase.from('tenants').select('id').limit(1)
  if (error) throw new Error('Failed to check tenants: ' + error.message)
  if (data.length > 0) {
    console.log('⚠ Tenants already exist. Clearing existing data first...')
    await clearData()
  }
}

async function clearData() {
  // Delete in reverse dependency order
  const tables = ['rent_payments', 'utility_readings', 'expenses', 'tenants']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.log(`  ⚠ Could not clear ${table}: ${error.message}`)
    else console.log(`  ✓ Cleared ${table}`)
  }
}

// ============================================
// Step 3: Insert tenants
// ============================================
async function insertTenants() {
  const tenantMap = {}
  for (const t of TENANTS) {
    const unitId = unitMap[t.unit_number]
    if (!unitId) {
      console.log(`  ⚠ Unit ${t.unit_number} not found, skipping tenant ${t.full_name}`)
      continue
    }
    const { data, error } = await supabase.from('tenants').insert({
      full_name: t.full_name,
      phone: t.phone,
      email: t.email,
      unit_id: unitId,
      lease_start: t.lease_start,
      lease_end: t.lease_end,
    }).select('id, full_name, unit_id').single()
    if (error) {
      console.log(`  ✗ Failed to insert tenant ${t.full_name}: ${error.message}`)
      continue
    }
    tenantMap[t.unit_number] = data
    console.log(`  ✓ Tenant: ${t.full_name} → Unit ${t.unit_number}`)
  }
  return tenantMap
}

// ============================================
// Step 4: Insert rent payments (Jan–Jun 2026)
// ============================================
async function insertPayments(tenantMap) {
  const payments = []

  // Helper to create a payment
  const p = (unitNum, amount, date, month, year, status, notes) => {
    const t = tenantMap[unitNum]
    if (!t) return null
    return {
      tenant_id: t.id,
      unit_id: t.unit_id,
      amount,
      payment_date: date,
      period_month: month,
      period_year: year,
      status,
      notes,
    }
  }

  // January 2026 — all paid
  payments.push(p('101', 5000, '2026-01-03', 1, 2026, 'paid', 'Cash'))
  payments.push(p('102', 5000, '2026-01-05', 1, 2026, 'paid', 'GCash'))
  payments.push(p('104', 5000, '2026-01-04', 1, 2026, 'paid', 'Cash'))
  payments.push(p('201', 5500, '2026-01-06', 1, 2026, 'paid', 'Bank transfer'))
  payments.push(p('203', 5500, '2026-01-03', 1, 2026, 'paid', 'Cash'))
  payments.push(p('204', 5500, '2026-01-05', 1, 2026, 'paid', 'GCash'))
  payments.push(p('301', 6000, '2026-01-02', 1, 2026, 'paid', 'Cash'))
  payments.push(p('302', 6000, '2026-01-07', 1, 2026, 'paid', 'Bank transfer'))
  payments.push(p('304', 6000, '2026-01-04', 1, 2026, 'paid', 'GCash'))

  // February 2026 — all paid
  payments.push(p('101', 5000, '2026-02-02', 2, 2026, 'paid', 'Cash'))
  payments.push(p('102', 5000, '2026-02-04', 2, 2026, 'paid', 'GCash'))
  payments.push(p('104', 5000, '2026-02-03', 2, 2026, 'paid', 'Cash'))
  payments.push(p('201', 5500, '2026-02-05', 2, 2026, 'paid', 'Bank transfer'))
  payments.push(p('203', 5500, '2026-02-02', 2, 2026, 'paid', 'Cash'))
  payments.push(p('204', 5500, '2026-02-06', 2, 2026, 'paid', 'GCash'))
  payments.push(p('301', 6000, '2026-02-03', 2, 2026, 'paid', 'Cash'))
  payments.push(p('302', 6000, '2026-02-05', 2, 2026, 'paid', 'Bank transfer'))
  payments.push(p('304', 6000, '2026-02-04', 2, 2026, 'paid', 'GCash'))

  // March 2026 — mostly paid, 1 overdue, 1 pending
  payments.push(p('101', 5000, '2026-03-03', 3, 2026, 'paid', 'Cash'))
  payments.push(p('102', 5000, '2026-03-05', 3, 2026, 'paid', 'GCash'))
  payments.push(p('104', 5000, '2026-03-04', 3, 2026, 'paid', 'Cash'))
  payments.push(p('201', 5500, '2026-03-02', 3, 2026, 'paid', 'Bank transfer'))
  payments.push(p('203', 5500, '2026-03-15', 3, 2026, 'overdue', 'Paid late'))
  payments.push(p('204', 5500, '2026-03-06', 3, 2026, 'paid', 'GCash'))
  payments.push(p('301', 6000, '2026-03-04', 3, 2026, 'paid', 'Cash'))
  payments.push(p('302', 6000, null, 3, 2026, 'pending', 'Tenant traveling'))
  payments.push(p('304', 6000, '2026-03-03', 3, 2026, 'paid', 'GCash'))

  // April 2026 — mostly paid, 1 pending, 1 overdue
  payments.push(p('101', 5000, '2026-04-02', 4, 2026, 'paid', 'Cash'))
  payments.push(p('102', 5000, '2026-04-05', 4, 2026, 'paid', 'GCash'))
  payments.push(p('104', 5000, null, 4, 2026, 'pending', 'Awaiting remittance'))
  payments.push(p('201', 5500, '2026-04-03', 4, 2026, 'paid', 'Bank transfer'))
  payments.push(p('203', 5500, '2026-04-06', 4, 2026, 'paid', 'Cash'))
  payments.push(p('204', 5500, '2026-04-02', 4, 2026, 'paid', 'GCash'))
  payments.push(p('301', 6000, '2026-04-04', 4, 2026, 'paid', 'Cash'))
  payments.push(p('302', 6000, '2026-04-03', 4, 2026, 'paid', 'Bank transfer'))
  payments.push(p('304', 6000, null, 4, 2026, 'overdue', 'Followed up via phone'))

  // May 2026 — mostly paid, 1 partial
  payments.push(p('101', 5000, '2026-05-03', 5, 2026, 'paid', 'Cash'))
  payments.push(p('102', 5000, '2026-05-04', 5, 2026, 'paid', 'GCash'))
  payments.push(p('104', 2500, '2026-05-06', 5, 2026, 'partial', 'Paid half, remainder next week'))
  payments.push(p('201', 5500, '2026-05-02', 5, 2026, 'paid', 'Bank transfer'))
  payments.push(p('203', 5500, '2026-05-05', 5, 2026, 'paid', 'Cash'))
  payments.push(p('204', 5500, '2026-05-03', 5, 2026, 'paid', 'GCash'))
  payments.push(p('301', 6000, '2026-05-04', 5, 2026, 'paid', 'Cash'))
  payments.push(p('302', 6000, '2026-05-02', 5, 2026, 'paid', 'Bank transfer'))
  payments.push(p('304', 6000, '2026-05-05', 5, 2026, 'paid', 'GCash'))

  // June 2026 — current month, mix of paid/pending/overdue
  payments.push(p('101', 5000, '2026-06-03', 6, 2026, 'paid', 'Cash'))
  payments.push(p('102', 5000, null, 6, 2026, 'pending', 'Not yet due'))
  payments.push(p('104', 5000, null, 6, 2026, 'overdue', 'Still awaiting payment'))
  payments.push(p('201', 5500, '2026-06-02', 6, 2026, 'paid', 'Bank transfer'))
  payments.push(p('203', 5500, null, 6, 2026, 'pending', 'Expected end of week'))
  payments.push(p('204', 5500, '2026-06-04', 6, 2026, 'paid', 'GCash'))
  payments.push(p('301', 6000, null, 6, 2026, 'pending', 'On travel'))
  payments.push(p('302', 6000, '2026-06-03', 6, 2026, 'paid', 'Bank transfer'))
  payments.push(p('304', 6000, null, 6, 2026, 'overdue', 'Sent reminder SMS'))

  const valid = payments.filter(Boolean)
  const { error } = await supabase.from('rent_payments').insert(valid)
  if (error) throw new Error('Failed to insert payments: ' + error.message)
  console.log(`✓ Inserted ${valid.length} rent payments (Jan–Jun 2026)`)
}

// ============================================
// Step 5: Insert utility readings (Jan–Jun 2026)
// ============================================
async function insertUtilityReadings() {
  const readings = []
  const occupiedUnits = ['101', '102', '104', '201', '203', '204', '301', '302', '304']

  // Electric readings (monthly, increasing through summer)
  const electricData = {
    '101': [[1000,1250],[1250,1520],[1520,1850],[1850,2240],[2240,2680],[2680,3020]],
    '102': [[800,1020],[1020,1260],[1260,1560],[1560,1920],[1920,2350],[2350,2680]],
    '104': [[1100,1380],[1380,1690],[1690,2060],[2060,2520],[2520,3080],[3080,3540]],
    '201': [[950,1210],[1210,1490],[1490,1840],[1840,2270],[2270,2790],[2790,3210]],
    '203': [[1200,1490],[1490,1800],[1800,2210],[2210,2720],[2720,3340],[3340,3890]],
    '204': [[880,1100],[1100,1350],[1350,1660],[1660,2050],[2050,2530],[2530,2920]],
    '301': [[1050,1340],[1340,1660],[1660,2050],[2050,2530],[2530,3120],[3120,3610]],
    '302': [[750,980],[980,1230],[1230,1540],[1540,1910],[1910,2360],[2360,2740]],
    '304': [[1150,1460],[1460,1790],[1790,2190],[2190,2700],[2700,3320],[3320,3860]],
  }

  // Water readings (monthly)
  const waterData = {
    '101': [[50,62],[62,74],[74,88],[88,105],[105,125],[125,148]],
    '102': [[40,51],[51,63],[63,76],[76,92],[92,112],[112,133]],
    '104': [[55,68],[68,82],[82,98],[98,118],[118,142],[142,170]],
    '201': [[45,57],[57,70],[70,84],[84,101],[101,122],[122,146]],
    '203': [[60,75],[75,90],[90,108],[108,130],[130,158],[158,190]],
    '204': [[38,48],[48,59],[59,71],[71,85],[85,102],[102,122]],
    '301': [[52,65],[65,79],[79,95],[95,114],[114,138],[138,165]],
    '302': [[35,45],[45,56],[56,68],[68,82],[82,99],[99,119]],
    '304': [[58,72],[72,87],[87,104],[104,125],[125,152],[152,182]],
  }

  for (const unitNum of occupiedUnits) {
    const unitId = unitMap[unitNum]
    if (!unitId) continue

    for (let month = 1; month <= 6; month++) {
      const [prev, curr] = electricData[unitNum][month - 1]
      const day = month === 6 ? '20' : '28'
      readings.push({
        unit_id: unitId,
        utility_type: 'electric',
        previous_reading: prev,
        current_reading: curr,
        rate_per_unit: 12,
        reading_date: `2026-${String(month).padStart(2, '0')}-${day}`,
        billing_period_month: month,
        billing_period_year: 2026,
      })

      const [wPrev, wCurr] = waterData[unitNum][month - 1]
      readings.push({
        unit_id: unitId,
        utility_type: 'water',
        previous_reading: wPrev,
        current_reading: wCurr,
        rate_per_unit: 50,
        reading_date: `2026-${String(month).padStart(2, '0')}-${day}`,
        billing_period_month: month,
        billing_period_year: 2026,
      })
    }
  }

  // Insert in batches of 20 to avoid payload limits
  for (let i = 0; i < readings.length; i += 20) {
    const batch = readings.slice(i, i + 20)
    const { error } = await supabase.from('utility_readings').insert(batch)
    if (error) throw new Error(`Failed to insert utility readings (batch ${i / 20 + 1}): ${error.message}`)
  }
  console.log(`✓ Inserted ${readings.length} utility readings (Jan–Jun 2026)`)
}

// ============================================
// Step 6: Insert expenses (Jan–Jun 2026)
// ============================================
async function insertExpenses() {
  const expenses = [
    // January
    { category: 'Salary', description: 'Security Guard', amount: 8000, expense_date: '2026-01-01' },
    { category: 'Salary', description: 'Cleaning Staff', amount: 5000, expense_date: '2026-01-01' },
    { category: 'Maintenance', description: 'Building Insurance (monthly)', amount: 2500, expense_date: '2026-01-01' },
    { category: 'Utilities (Building)', description: 'Corridor lighting', amount: 3200, expense_date: '2026-01-15' },
    { category: 'Supplies', description: 'Cleaning supplies', amount: 1500, expense_date: '2026-01-10' },
    { category: 'Repair', description: 'Door lock replacement (102)', amount: 800, expense_date: '2026-01-20' },
    // February
    { category: 'Salary', description: 'Security Guard', amount: 8000, expense_date: '2026-02-01' },
    { category: 'Salary', description: 'Cleaning Staff', amount: 5000, expense_date: '2026-02-01' },
    { category: 'Maintenance', description: 'Building Insurance (monthly)', amount: 2500, expense_date: '2026-02-01' },
    { category: 'Utilities (Building)', description: 'Corridor lighting', amount: 3100, expense_date: '2026-02-15' },
    { category: 'Supplies', description: 'Cleaning supplies', amount: 1200, expense_date: '2026-02-08' },
    { category: 'Maintenance', description: 'Pest control treatment', amount: 2000, expense_date: '2026-02-12' },
    // March
    { category: 'Salary', description: 'Security Guard', amount: 8000, expense_date: '2026-03-01' },
    { category: 'Salary', description: 'Cleaning Staff', amount: 5000, expense_date: '2026-03-01' },
    { category: 'Maintenance', description: 'Building Insurance (monthly)', amount: 2500, expense_date: '2026-03-01' },
    { category: 'Utilities (Building)', description: 'Corridor lighting', amount: 3500, expense_date: '2026-03-15' },
    { category: 'Supplies', description: 'Cleaning supplies', amount: 1800, expense_date: '2026-03-05' },
    { category: 'Repair', description: 'Water pipe fix (Floor 2)', amount: 3500, expense_date: '2026-03-18' },
    { category: 'Tax', description: 'Quarterly property tax', amount: 15000, expense_date: '2026-03-31' },
    // April
    { category: 'Salary', description: 'Security Guard', amount: 8000, expense_date: '2026-04-01' },
    { category: 'Salary', description: 'Cleaning Staff', amount: 5000, expense_date: '2026-04-01' },
    { category: 'Maintenance', description: 'Building Insurance (monthly)', amount: 2500, expense_date: '2026-04-01' },
    { category: 'Utilities (Building)', description: 'Corridor lighting', amount: 3800, expense_date: '2026-04-15' },
    { category: 'Utilities (Building)', description: 'Elevator maintenance', amount: 4500, expense_date: '2026-04-10' },
    { category: 'Supplies', description: 'Cleaning supplies', amount: 2000, expense_date: '2026-04-05' },
    { category: 'Repair', description: 'Aircon servicing (common area)', amount: 5000, expense_date: '2026-04-20' },
    // May
    { category: 'Salary', description: 'Security Guard', amount: 8500, expense_date: '2026-05-01' },
    { category: 'Salary', description: 'Cleaning Staff', amount: 5000, expense_date: '2026-05-01' },
    { category: 'Maintenance', description: 'Building Insurance (monthly)', amount: 2500, expense_date: '2026-05-01' },
    { category: 'Utilities (Building)', description: 'Corridor lighting', amount: 4200, expense_date: '2026-05-15' },
    { category: 'Supplies', description: 'Cleaning supplies', amount: 2200, expense_date: '2026-05-08' },
    { category: 'Maintenance', description: 'Roof waterproofing', amount: 12000, expense_date: '2026-05-22' },
    { category: 'Other', description: 'Landscaping/garden upkeep', amount: 3000, expense_date: '2026-05-10' },
    // June
    { category: 'Salary', description: 'Security Guard', amount: 8500, expense_date: '2026-06-01' },
    { category: 'Salary', description: 'Cleaning Staff', amount: 5500, expense_date: '2026-06-01' },
    { category: 'Maintenance', description: 'Building Insurance (monthly)', amount: 2500, expense_date: '2026-06-01' },
    { category: 'Utilities (Building)', description: 'Corridor lighting', amount: 4500, expense_date: '2026-06-15' },
    { category: 'Supplies', description: 'Cleaning supplies', amount: 1800, expense_date: '2026-06-05' },
    { category: 'Repair', description: 'CCTV camera repair', amount: 6000, expense_date: '2026-06-12' },
  ]

  const { error } = await supabase.from('expenses').insert(expenses)
  if (error) throw new Error('Failed to insert expenses: ' + error.message)
  console.log(`✓ Inserted ${expenses.length} expenses (Jan–Jun 2026)`)
}

// ============================================
// Step 7: Verify
// ============================================
async function verify() {
  const checks = [
    ['tenants', 'tenants'],
    ['rent_payments', 'payments'],
    ['utility_readings', 'utility readings'],
    ['expenses', 'expenses'],
  ]
  for (const [table, label] of checks) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) console.log(`  ✗ ${label}: error — ${error.message}`)
    else console.log(`  ✓ ${label}: ${count} rows`)
  }
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('🏢 Tomaquin Building — Seeding Database (Jan–Jun 2026)\n')

  try {
    await fetchUnits()
    await checkExisting()

    console.log('\n📝 Inserting tenants...')
    const tenantMap = await insertTenants()

    console.log('\n💰 Inserting rent payments...')
    await insertPayments(tenantMap)

    console.log('\n⚡ Inserting utility readings...')
    await insertUtilityReadings()

    console.log('\n🧾 Inserting expenses...')
    await insertExpenses()

    console.log('\n📊 Verifying counts:')
    await verify()

    console.log('\n✅ Seed complete!')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
