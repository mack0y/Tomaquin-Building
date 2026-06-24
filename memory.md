# Tomaquin Building — Memory File

> This file is a comprehensive reference for future coding sessions.
> Keep it updated whenever significant changes are made to the project.

---

## 1. Project Overview

**Name:** Tomaquin Building Management System
**Purpose:** Personal-use web dashboard for a building owner to track renters, rent payments, due dates, utilities (electric + water), cashflow, and financial reports for a 3-story building with 12 units.
**Stack:** React + Vite + Tailwind CSS v4 + Supabase (PostgreSQL) + GitHub Pages
**Currency:** PHP (₱)
**UI Style:** Modern dashboard — dark sidebar, light content area, card-based layout

---

## 2. Tech Stack & Dependencies

### Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.7 | UI framework |
| react-dom | ^19.2.7 | DOM rendering |
| react-router-dom | ^7.18.0 | Client-side routing |
| @supabase/supabase-js | ^2.108.2 | Supabase client |
| recharts | ^3.9.0 | Charts (bar, line, pie) |
| lucide-react | ^1.21.0 | Icons |
| clsx | ^2.1.1 | Conditional classnames |
| tailwind-merge | ^3.6.0 | Tailwind class deduplication |
| class-variance-authority | ^0.7.1 | Component variants |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^8.1.0 | Build tool |
| @vitejs/plugin-react | ^6.0.2 | React support for Vite |
| tailwindcss | ^4.3.1 | CSS framework |
| @tailwindcss/vite | ^4.3.1 | Tailwind Vite plugin |
| tailwindcss-animate | ^1.0.7 | Animation utilities |
| oxlint | ^1.69.0 | Linter |

---

## 3. Project Structure

```
Tomaquin-Building/
├── .env                          # Supabase credentials (not in git)
├── .env.example                  # Template for .env
├── index.html                    # Entry HTML
├── package.json
├── vite.config.js                # Vite + React + Tailwind + path alias
├── supabase/
│   ├── schema.sql                # Full database schema + seed data
│   └── migrations/
│       └── 002_recurring_expenses.sql  # Recurring expenses table
├── src/
│   ├── main.jsx                  # Entry point (BrowserRouter + ToastProvider)
│   ├── App.jsx                   # Route definitions
│   ├── index.css                 # Tailwind v4 imports + theme + animations
│   ├── lib/
│   │   ├── supabase.js           # Supabase client initialization
│   │   └── utils.js              # cn(), formatCurrency(), formatDate(), formatMonthYear(), getCurrentMonth()
│   ├── hooks/
│   │   └── useSupabase.js        # useSupabaseQuery(), useSupabaseMutation()
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx        # Sidebar + Header + <Outlet />
│   │   │   ├── Sidebar.jsx       # Navigation with Lucide icons
│   │   │   └── Header.jsx        # Page title + current date
│   │   └── ui/
│   │       ├── index.jsx         # Card, Button, StatusBadge, Modal, EmptyState, Input, Select
│   │       └── Toast.jsx         # ToastProvider, useToast() for success/error notifications
│   └── pages/
│       ├── Dashboard.jsx         # Main dashboard with quick actions, stats, unit profit, recurring expenses, occupancy, recent payments
│       ├── Units.jsx             # Units CRUD grouped by floor
│       ├── Tenants.jsx           # Tenants CRUD with search, auto unit status update
│       ├── Payments.jsx          # Rent payments with status tracking, filters
│       ├── Utilities.jsx         # Electric + water meter readings, tabs
│       ├── Cashflow.jsx          # Income vs expenses, charts, expense CRUD
│       └── Reports.jsx           # Monthly/yearly reports, charts, CSV export
└── dist/                         # Production build output
```

---

## 4. Supabase Configuration

### Project Details
- **Project ID:** `fdgmkvqlclldcsiggtkl`
- **URL:** `https://fdgmkvqlclldcsiggtkl.supabase.co`
- **Region:** Southeast Asia (assumed)

### Environment Variables (.env)
```
VITE_SUPABASE_URL=https://fdgmkvqlclldcsiggtkl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Schema (6 Tables)

#### `units`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| unit_number | TEXT | Unique (e.g. "101", "203") |
| floor | INTEGER | 1-10 |
| rent_amount | DECIMAL(10,2) | Monthly rent in PHP |
| status | unit_status enum | occupied, vacant, maintenance |
| created_at, updated_at | TIMESTAMPTZ | Auto-managed |

#### `tenants`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| full_name | TEXT | Required |
| phone | TEXT | Optional |
| email | TEXT | Optional |
| unit_id | UUID FK → units | ON DELETE SET NULL |
| lease_start | DATE | Optional |
| lease_end | DATE | Optional, null = ongoing |
| created_at, updated_at | TIMESTAMPTZ | |

#### `rent_payments`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| tenant_id | UUID FK → tenants | ON DELETE CASCADE |
| unit_id | UUID FK → units | ON DELETE CASCADE |
| amount | DECIMAL(10,2) | Payment amount in PHP |
| payment_date | DATE | When payment was made |
| period_month | INTEGER | 1-12 (billing period) |
| period_year | INTEGER | 2020-2100 |
| status | payment_status enum | paid, pending, overdue, partial |
| notes | TEXT | Optional |
| created_at | TIMESTAMPTZ | |

#### `utility_readings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| unit_id | UUID FK → units | ON DELETE CASCADE |
| utility_type | utility_type enum | electric, water |
| previous_reading | DECIMAL(10,2) | Last meter reading |
| current_reading | DECIMAL(10,2) | Current meter reading |
| rate_per_unit | DECIMAL(10,2) | Cost per kWh or m³ |
| total_cost | DECIMAL(10,2) | GENERATED: (current - previous) * rate |
| reading_date | DATE | |
| billing_period_month | INTEGER | 1-12 |
| billing_period_year | INTEGER | 2020-2100 |
| created_at | TIMESTAMPTZ | |

#### `expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| category | TEXT | Maintenance, Repair, Salary, Supplies, Insurance, Tax, Utilities (Building), Other |
| description | TEXT | Optional |
| amount | DECIMAL(10,2) | |
| expense_date | DATE | |
| created_at | TIMESTAMPTZ | |

#### `recurring_expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| category | TEXT | Same categories as expenses |
| description | TEXT | e.g. "Security Guard", "Cleaning Staff" |
| amount | DECIMAL(10,2) | Fixed monthly amount |
| day_of_month | INTEGER | 1-28, when to generate |
| is_active | BOOLEAN | Default true |
| created_at, updated_at | TIMESTAMPTZ | |

**Seed data for recurring expenses:**
- Security Guard: ₱8,000/month
- Cleaning Staff: ₱5,000/month
- Building Insurance: ₱2,500/month

### Seed Data (Units)
| Unit | Floor | Rent | Status |
|------|-------|------|--------|
| 101-104 | 1 | ₱5,000 | 3 occupied, 1 vacant |
| 201-204 | 2 | ₱5,500 | 3 occupied, 1 vacant |
| 301-304 | 3 | ₱6,000 | 3 occupied, 1 vacant |

### RLS Policies
All tables have RLS enabled with "Allow all" policies (no auth yet). Ready for auth to be added later.

### Database Triggers
- `update_units_updated_at` — auto-updates `updated_at` on units
- `update_tenants_updated_at` — auto-updates `updated_at` on tenants
- `update_recurring_expenses_updated_at` — auto-updates `updated_at` on recurring_expenses

---

## 5. Vite Configuration

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Path alias:** `@` maps to `./src`

---

## 6. Theme & Design System

### Colors (defined in `src/index.css` via `@theme`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-sidebar` | #1e1e2d | Dark sidebar background |
| `--color-sidebar-hover` | #2a2a3d | Sidebar hover state |
| `--color-sidebar-active` | #3a3a52 | Active nav item |
| `--color-primary` | #6366f1 | Indigo primary |
| `--color-primary-light` | #818cf8 | Lighter indigo |
| `--color-primary-dark` | #4f46e5 | Darker indigo |
| `--color-success` | #22c55e | Green — paid, occupied, positive |
| `--color-warning` | #f59e0b | Amber — pending, maintenance |
| `--color-danger` | #ef4444 | Red — overdue, vacant, expenses |
| `--color-info` | #3b82f6 | Blue — informational |
| `--color-surface` | #f8fafc | Page background |
| `--color-surface-card` | #ffffff | Card background |
| `--color-border` | #e2e8f0 | Borders and dividers |
| `--color-text-primary` | #1e293b | Main text |
| `--color-text-secondary` | #64748b | Secondary text |
| `--color-text-muted` | #94a3b8 | Muted/placeholder text |

### Status Badges
| Status | Color | Label |
|--------|-------|-------|
| occupied | green | Occupied |
| vacant | red | Vacant |
| maintenance | yellow | Maintenance |
| paid | green | Paid |
| pending | blue | Pending |
| overdue | red | Overdue |
| partial | yellow | Partial |

### Animations
- `@keyframes slideUp` — used for toast notifications (opacity 0 → 1, translateY 16px → 0)

---

## 7. Shared Components (`src/components/ui/index.jsx`)

| Component | Props | Description |
|-----------|-------|-------------|
| `Card` | className, children | Rounded card with border and shadow |
| `CardHeader` | className, children | Card header section |
| `CardTitle` | className, children | Card title text |
| `Button` | variant (primary/secondary/danger/success/ghost), size (sm/md/lg), className, children | Action button |
| `StatusBadge` | status | Colored badge for unit/payment status |
| `Modal` | isOpen, onClose, title, children | Overlay modal with backdrop |
| `EmptyState` | icon, title, description, action | Empty state placeholder |
| `Input` | label, className, id, ...props | Form input with label (auto-generates id/name from label) |
| `Select` | label, className, id, children, ...props | Form select with label (auto-generates id/name from label) |

**Toast component** (`src/components/ui/Toast.jsx`):
- `ToastProvider` — wraps the app, provides toast context
- `useToast()` — returns `{ success(msg), error(msg) }`
- Toasts auto-dismiss after 3 seconds, slide-up animation

---

## 8. Custom Hooks (`src/hooks/useSupabase.js`)

### `useSupabaseQuery(table, options)`
Fetches data from Supabase with select, order, and filter support.
```js
const { data, loading, error, refetch } = useSupabaseQuery('units', {
  select: '*, tenants(full_name)',
  order: { column: 'unit_number', ascending: true },
  filters: [
    { column: 'status', value: 'occupied' },
  ],
})
```

### `useSupabaseMutation(table)`
Returns `{ insert, update, remove, loading, error }` for CRUD operations.
```js
const { insert, update, remove, loading } = useSupabaseMutation('units')
await insert({ unit_number: '401', floor: 4, rent_amount: 7000, status: 'vacant' })
await update(id, { rent_amount: 7500 })
await remove(id)
```

---

## 9. Utility Functions (`src/lib/utils.js`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn(...inputs)` | `(...classes) → string` | Tailwind class merge (clsx + twMerge) |
| `formatCurrency(amount)` | `(number) → string` | Formats as ₱X,XXX.XX |
| `formatDate(date)` | `(string/Date) → string` | Formats as "Jan 1, 2026" |
| `formatMonthYear(month, year)` | `(number, number) → string` | Formats as "June 2026" |
| `getCurrentMonth()` | `() → { month, year }` | Returns current month (1-12) and year |

---

## 10. Page Summaries

### Dashboard (`src/pages/Dashboard.jsx`)
- **Quick Actions bar:** Record Payment, Add Expense, Record Reading buttons
- **Summary cards:** Total Units, Total Tenants, Collected (with % change vs last month), Net Cashflow (with expense % change)
- **Overdue alert banner** — shows count and total overdue
- **Unit Profitability** — per-unit card showing rent, utilities, profit (rent - utilities)
- **Recurring Expenses** — list with one-click generate button
- **Occupancy by Floor** — 3-column grid with colored unit boxes (green/red/yellow)
- **Recent Payments table** — last 8 payments with status badges
- **Modals:** Quick Payment (tenant, amount, date, period), Quick Expense (category, description, amount, date)

### Units (`src/pages/Units.jsx`)
- Stats cards (Total, Occupied, Vacant, Maintenance)
- Units grouped by floor (Floor 1, 2, 3) in 4-column grid
- Each unit card shows: unit number, rent amount, status badge, edit/delete buttons
- Add/Edit modal with unit number, floor, rent amount, status

### Tenants (`src/pages/Tenants.jsx`)
- Search bar for filtering by name, phone, email
- Tenant cards in 3-column grid showing: name, unit assignment, phone, email, lease dates
- Auto-updates unit status: assigning tenant → occupied, removing → vacant (checks for other tenants first)
- Add/Edit modal with full name, phone, email, unit assignment, lease dates

### Payments (`src/pages/Payments.jsx`)
- Summary cards: Total Revenue, Paid, Pending, Overdue
- Filters: Month, Year, Status
- Table: Tenant, Unit, Amount, Date, Status, Notes, Edit action
- Modal: Tenant selector (auto-fills unit), amount, date, period, year, status, notes

### Utilities (`src/pages/Utilities.jsx`)
- Electric / Water tab switcher
- Stats: Total Cost, Units Billed, Total Usage (kWh or m³), Readings count
- Filters: Month, Year
- Table: Unit, Previous/Current Reading, Usage, Rate, Cost, Edit action
- Modal: Unit selector, readings, rate, date, billing period
- Live estimated cost preview in modal

### Cashflow (`src/pages/Cashflow.jsx`)
- Summary cards: Income, Expenses, Net Cashflow, Pending Collections
- Filters: Month, Year
- Charts: Monthly Trend (bar), Expense Breakdown (pie)
- Expenses table with Add/Edit/Delete
- Expense modal: category, description, amount, date

### Reports (`src/pages/Reports.jsx`)
- Toggle: Monthly / Yearly view
- Summary cards: Total Revenue, Total Expenses, Net Profit, Avg Collection Rate + Occupancy
- Monthly detail (when monthly view selected)
- 4 charts: Revenue vs Expenses (bar), Net Cashflow Trend (line), Expense Breakdown (pie), Collection Rate (bar)
- Monthly Summary Table with totals
- Export: CSV download, Print button

---

## 11. Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Home page with overview |
| `/units` | Units | Unit management |
| `/tenants` | Tenants | Tenant management |
| `/payments` | Payments | Rent payment tracking |
| `/utilities` | Utilities | Electric + water readings |
| `/cashflow` | Cashflow | Income vs expenses |
| `/reports` | Reports | Financial reports |
| `*` | Navigate → `/` | Catch-all redirect |

---

## 12. Known Issues & Technical Debt

1. **Dashboard.jsx is large** (~400 lines) — contains quick actions, modals, unit profit, recurring expenses, occupancy, and payments table. Should be split into smaller components if adding more features.
2. **Expense categories duplicated** — `EXPENSE_CATEGORIES` is defined in both Dashboard.jsx and Cashflow.jsx. Should be extracted to a shared constant.
3. **No duplicate check for recurring expense generation** — clicking generate twice creates duplicate entries for the same month.
4. **Client-side filtering for expenses** — Dashboard and Cashflow fetch all expenses then filter by month/year client-side. Could use Supabase date filters for better performance at scale.
5. **No authentication** — RLS allows all operations. Ready for Supabase Auth to be added.
6. **Chunk size warning** — production bundle is ~944KB (gzip ~266KB). Could use dynamic imports / code splitting.
7. **No mobile responsive sidebar** — sidebar is fixed width, no hamburger menu for mobile.

---

## 13. Development Commands

```bash
npm run dev        # Start development server (localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run lint       # Run oxlint
```

---

## 14. Deployment (Planned: GitHub Pages)

- Static site — just deploy the `dist/` folder
- Need to set `base` in vite.config.js for GitHub Pages subpath
- Environment variables must be set at build time (Vite inlines them)
- Supabase anon key is safe to expose in client-side code (RLS protects data)

---

## 15. Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Supabase + GitHub Pages | Zero server cost, managed database, easy static hosting |
| No auth (MVP) | Personal use — owner is the only user. Can add auth later. |
| Manual recurring expense generation | Owner controls when to generate, avoids surprises |
| Unit status auto-update on tenant assign/delete | Reduces manual bookkeeping |
| PHP currency throughout | Building is in the Philippines |
| Dark sidebar + light content | Modern dashboard aesthetic |
| Cards with shadows | Visual hierarchy, easy to scan |
| Status badges (colored) | Instant visual status recognition |

---

## 16. Future Enhancements (Not Yet Implemented)

- [ ] Mobile responsive sidebar with hamburger menu
- [ ] Authentication (Supabase Auth)
- [ ] Deploy to GitHub Pages
- [ ] Lease renewal alerts (60-day advance notice)
- [ ] Expense category shared constant
- [ ] Duplicate check for recurring expense generation
- [ ] Supabase date filters for expense queries (performance)
- [ ] Code splitting for smaller bundle
- [ ] PDF export for reports
- [ ] Tenant payment history view

---

## 17. Supabase SQL Quick Reference

### Add a new unit
```sql
INSERT INTO units (unit_number, floor, rent_amount, status) VALUES ('401', 4, 7000, 'vacant');
```

### Record a payment
```sql
INSERT INTO rent_payments (tenant_id, unit_id, amount, payment_date, period_month, period_year, status)
VALUES ('<tenant-uuid>', '<unit-uuid>', 5000, '2026-06-15', 6, 2026, 'paid');
```

### Record utility reading
```sql
INSERT INTO utility_readings (unit_id, utility_type, previous_reading, current_reading, rate_per_unit, reading_date, billing_period_month, billing_period_year)
VALUES ('<unit-uuid>', 'electric', 1000, 1200, 12, '2026-06-15', 6, 2026);
-- total_cost auto-calculated: (1200 - 1000) * 12 = 2400
```

### Add a recurring expense
```sql
INSERT INTO recurring_expenses (category, description, amount, day_of_month) VALUES ('Maintenance', 'Monthly Pest Control', 1500, 15);
```

### Check unit profit
```sql
SELECT
  u.unit_number,
  u.rent_amount,
  COALESCE(SUM(ur.total_cost), 0) as utility_costs,
  u.rent_amount - COALESCE(SUM(ur.total_cost), 0) as profit
FROM units u
LEFT JOIN utility_readings ur ON ur.unit_id = u.id
  AND ur.billing_period_month = 6 AND ur.billing_period_year = 2026
WHERE u.status = 'occupied'
GROUP BY u.id, u.unit_number, u.rent_amount;
```
