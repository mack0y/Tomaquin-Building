import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Zap,
  TrendingUp,
  BarChart3,
  X,
} from 'lucide-react'
import { useSupabaseQuery } from '../../hooks/useSupabase'
import { useNotifications } from '../../hooks/useNotifications'
import { getCurrentMonth } from '../../lib/utils'
import { useSidebar } from './Layout'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: 'dashboard' },
  { to: '/units', icon: Building2, label: 'Units' },
  { to: '/tenants', icon: Users, label: 'Tenants' },
  { to: '/payments', icon: CreditCard, label: 'Payments', badge: 'payments' },
  { to: '/utilities', icon: Zap, label: 'Utilities' },
  { to: '/cashflow', icon: TrendingUp, label: 'Cashflow' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const location = useLocation()

  const { month: filterMonth, year: filterYear } = getCurrentMonth()

  // Fetch data for notifications
  const { data: units } = useSupabaseQuery('units', { order: { column: 'unit_number', ascending: true } })
  const { data: tenants } = useSupabaseQuery('tenants', { select: '*, units(unit_number)' })
  const { data: payments } = useSupabaseQuery('rent_payments', {
    select: 'amount, status, period_month, period_year',
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
    ],
  })
  const { data: utilityReadings } = useSupabaseQuery('utility_readings', {
    select: 'unit_id, billing_period_month, billing_period_year',
  })
  const { data: expenses } = useSupabaseQuery('expenses', { select: 'id, category, expense_date' })
  const { data: recurringExpenses } = useSupabaseQuery('recurring_expenses', { select: 'id, category, description, amount, day_of_month' })

  const { notificationCount } = useNotifications({
    units, tenants, payments, utilityReadings, expenses, recurringExpenses,
    filterMonth, filterYear,
  })

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary-light" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Tomaquin</h1>
            <p className="text-xs text-text-muted">Building Management</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1 text-text-muted hover:bg-sidebar-hover hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-active text-white shadow-lg shadow-black/10'
                  : 'text-text-muted hover:bg-sidebar-hover hover:text-white hover:translate-x-0.5'
              }`
            }
          >
            <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1">{item.label}</span>
            {item.badge === 'dashboard' && notificationCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-bold text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-text-muted">© 2026 Tomaquin Building</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
