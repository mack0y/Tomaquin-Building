import { Edit2, Zap } from 'lucide-react'
import { Card, Button, EmptyState } from '../ui'
import { SkeletonTable } from '../ui/Skeleton'
import { formatCurrency, formatMonthYear } from '../../lib/utils'

export default function UtilityTable({ readings, loading, filterMonth, filterYear, activeTab, onEdit, onAdd, activeIcon }) {
  if (loading) return <SkeletonTable rows={6} cols={7} />

  if (readings.length === 0) {
    return (
      <EmptyState
        icon={activeIcon?.icon || Zap}
        title="No readings found"
        description={`No ${activeTab} readings for ${formatMonthYear(filterMonth, filterYear)}.`}
        action={<Button onClick={onAdd}>Record Reading</Button>}
      />
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Unit</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Previous</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Current</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Usage</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Rate</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Cost</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const usage = Number(r.current_reading) - Number(r.previous_reading)
            return (
              <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-surface">
                <td className="px-4 py-3 text-sm font-medium text-text-primary">
                  Unit {r.units?.unit_number}
                  <span className="text-text-muted ml-1">F{r.units?.floor}</span>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{r.previous_reading}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{r.current_reading}</td>
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{usage.toFixed(1)}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">₱{r.rate_per_unit}</td>
                <td className="px-4 py-3 text-sm font-medium text-success">{formatCurrency(r.total_cost)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
