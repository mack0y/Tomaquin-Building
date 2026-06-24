import { Building2, Users, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card } from '../ui'
import { formatCurrency } from '../../lib/utils'

export default function SummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <p className="text-sm text-text-secondary">Total Units</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalUnits}</p>
        <p className="text-xs text-text-muted">
          {stats.occupied} occupied · {stats.vacant} vacant · {stats.occupancyRate}% rate
        </p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-info" />
          <p className="text-sm text-text-secondary">Total Tenants</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalTenants}</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <p className="text-sm text-text-secondary">Collected</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(stats.totalCollected)}</p>
        {stats.incomeChange !== null && (
          <p className={`text-xs flex items-center gap-1 ${Number(stats.incomeChange) >= 0 ? 'text-success' : 'text-danger'}`}>
            {Number(stats.incomeChange) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(Number(stats.incomeChange))}% vs last month
          </p>
        )}
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-danger" />
          <p className="text-sm text-text-secondary">Net Cashflow</p>
        </div>
        <p className={`mt-1 text-2xl font-bold ${stats.netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
          {formatCurrency(stats.netCashflow)}
        </p>
        <p className="text-xs text-text-muted">
          Expenses: {formatCurrency(stats.monthExpenses)}
          {stats.expenseChange !== null && (
            <span className={`ml-1 ${Number(stats.expenseChange) >= 0 ? 'text-danger' : 'text-success'}`}>
              {Number(stats.expenseChange) >= 0 ? '↑' : '↓'}{Math.abs(Number(stats.expenseChange))}%
            </span>
          )}
        </p>
      </Card>
    </div>
  )
}
