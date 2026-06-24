import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const pageTitles = {
  '/': 'Dashboard',
  '/units': 'Units Management',
  '/tenants': 'Tenants',
  '/payments': 'Rent Payments',
  '/utilities': 'Utilities',
  '/cashflow': 'Cashflow',
  '/reports': 'Reports',
}

export default function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Dashboard'

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-card px-6 py-4">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-text-secondary hover:bg-surface lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          {new Date().toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
    </header>
  )
}
