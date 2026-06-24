import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, Button, StatusBadge } from '../ui'
import { formatCurrency, formatMonthYear } from '../../lib/utils'

export default function RecentPaymentsTable({ recentPayments, filterMonth, filterYear }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">
          Recent Payments — {formatMonthYear(filterMonth, filterYear)}
        </h3>
        <Link to="/payments">
          <Button variant="ghost" size="sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
      {recentPayments.length === 0 ? (
        <p className="py-6 text-center text-text-muted">No payments recorded this month</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-xs font-medium text-text-secondary">Tenant</th>
                <th className="pb-2 text-left text-xs font-medium text-text-secondary">Unit</th>
                <th className="pb-2 text-left text-xs font-medium text-text-secondary">Amount</th>
                <th className="pb-2 text-left text-xs font-medium text-text-secondary">Date</th>
                <th className="pb-2 text-left text-xs font-medium text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="py-2.5 text-sm font-medium text-text-primary">{p.tenants?.full_name || '—'}</td>
                  <td className="py-2.5 text-sm text-text-secondary">{p.units?.unit_number || '—'}</td>
                  <td className="py-2.5 text-sm font-medium text-text-primary">{formatCurrency(p.amount)}</td>
                  <td className="py-2.5 text-sm text-text-secondary">{p.payment_date || '—'}</td>
                  <td className="py-2.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
