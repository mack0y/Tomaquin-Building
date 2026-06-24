import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Zap,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/units', icon: Building2, label: 'Units' },
  { to: '/tenants', icon: Users, label: 'Tenants' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/utilities', icon: Zap, label: 'Utilities' },
  { to: '/cashflow', icon: TrendingUp, label: 'Cashflow' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col bg-sidebar text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <Building2 className="h-7 w-7 text-primary-light" />
        <div>
          <h1 className="text-lg font-bold leading-tight">Tomaquin</h1>
          <p className="text-xs text-text-muted">Building Management</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-text-muted hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-text-muted">© 2026 Tomaquin Building</p>
      </div>
    </aside>
  )
}
