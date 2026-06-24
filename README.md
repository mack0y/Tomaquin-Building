# Tomaquin Building — Management System

A personal-use web dashboard for tracking rental units, tenants, rent payments, utilities, cashflow, and financial reports for a 3-story building with 12 units.

## Features

- **Dashboard** — Quick actions, summary cards, unit profitability, recurring expenses, occupancy by floor, recent payments
- **Units Management** — CRUD operations grouped by floor (3 floors × 4 units)
- **Tenants Management** — CRUD with search, auto unit status updates on assign/delete
- **Rent Payments** — Record, edit, filter by month/year/status (paid, pending, overdue, partial)
- **Utilities** — Electric + water meter readings with auto cost calculation
- **Cashflow** — Income vs expenses with bar/pie charts, expense CRUD
- **Reports** — Monthly/yearly breakdowns, charts, CSV export
- **Recurring Expenses** — Pre-configured monthly costs with one-click generation

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **UI:** Custom component library (Card, Button, Modal, StatusBadge, Toast)
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Currency:** PHP (₱)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mack0y/Tomaquin-Building.git
   cd Tomaquin-Building
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the SQL schema in Supabase SQL Editor (see `supabase/schema.sql` and `supabase/migrations/002_recurring_expenses.sql`)

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── layout/    — Sidebar, Header, Layout
│   └── ui/        — Card, Button, Modal, Input, Select, Toast, etc.
├── hooks/         — useSupabaseQuery, useSupabaseMutation
├── lib/           — Supabase client, utility functions
└── pages/         — Dashboard, Units, Tenants, Payments, Utilities, Cashflow, Reports
```

## License

Private — for personal use.
