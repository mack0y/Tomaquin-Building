import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card } from '../ui'
import { formatCurrency } from '../../lib/utils'

export default function PaymentStats({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <p className="text-sm text-text-secondary">Total Revenue</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <p className="text-sm text-text-secondary">Paid</p>
        </div>
        <p className="mt-1 text-xl font-bold text-success">{formatCurrency(stats.paid)}</p>
        <p className="text-xs text-text-muted">{stats.paidCount} payments</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-info" />
          <p className="text-sm text-text-secondary">Pending</p>
        </div>
        <p className="mt-1 text-xl font-bold text-info">{formatCurrency(stats.pending)}</p>
        <p className="text-xs text-text-muted">{stats.pendingCount} payments</p>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-danger" />
          <p className="text-sm text-text-secondary">Overdue</p>
        </div>
        <p className="mt-1 text-xl font-bold text-danger">{formatCurrency(stats.overdue)}</p>
        <p className="text-xs text-text-muted">{stats.overdueCount} payments</p>
      </Card>
    </div>
  )
}
