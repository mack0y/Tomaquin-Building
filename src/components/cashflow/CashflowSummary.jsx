import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card } from '../ui'
import { formatCurrency } from '../../lib/utils'

export default function CashflowSummary({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <p className="text-sm text-text-secondary">Income</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(stats.totalIncome)}</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-danger" />
          <p className="text-sm text-text-secondary">Expenses</p>
        </div>
        <p className="mt-1 text-2xl font-bold text-danger">{formatCurrency(stats.totalExpenses)}</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <p className="text-sm text-text-secondary">Net Cashflow</p>
        </div>
        <p className={`mt-1 text-2xl font-bold ${stats.netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
          {formatCurrency(stats.netCashflow)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-secondary">Pending Collections</p>
        <p className="mt-1 text-2xl font-bold text-warning">{formatCurrency(stats.totalPending)}</p>
      </Card>
    </div>
  )
}
