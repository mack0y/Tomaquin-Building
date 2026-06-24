import { Edit2, Trash2 } from 'lucide-react'
import { Card, Button } from '../ui'
import { formatCurrency } from '../../lib/utils'

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-text-muted">No expenses for this period</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Description</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Amount</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Date</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-border last:border-b-0 hover:bg-surface">
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{expense.category}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{expense.description || '—'}</td>
              <td className="px-4 py-3 text-sm font-medium text-danger">{formatCurrency(expense.amount)}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{expense.expense_date}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(expense)}>
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
