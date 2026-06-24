import { Edit2 } from 'lucide-react'
import { Card, Button, StatusBadge, EmptyState } from '../ui'
import { SkeletonTable } from '../ui/Skeleton'
import { formatCurrency, formatMonthYear } from '../../lib/utils'
import { CreditCard } from 'lucide-react'

export default function PaymentTable({ payments, loading, filterMonth, filterYear, onEdit, onAdd }) {
  if (loading) return <SkeletonTable rows={6} cols={7} />

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No payments found"
        description={`No payments recorded for ${formatMonthYear(filterMonth, filterYear)}.`}
        action={<Button onClick={onAdd}>Record Payment</Button>}
      />
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Tenant</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Unit</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Amount</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Notes</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-border last:border-b-0 hover:bg-surface">
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{payment.tenants?.full_name || '—'}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">Unit {payment.units?.unit_number || '—'}</td>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrency(payment.amount)}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{payment.payment_date || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
              <td className="px-4 py-3 text-sm text-text-muted max-w-[200px] truncate">{payment.notes || '—'}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(payment)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
