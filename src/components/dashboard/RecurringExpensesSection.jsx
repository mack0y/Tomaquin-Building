import { Plus } from 'lucide-react'
import { Card, Button } from '../ui'
import { formatCurrency } from '../../lib/utils'

export default function RecurringExpensesSection({
  recurringExpenses,
  onAdd,
  onEdit,
  onDelete,
  onGenerate,
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Recurring Expenses
        </h3>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add Template
        </Button>
      </div>
      {recurringExpenses.length === 0 ? (
        <Card>
          <p className="py-4 text-center text-text-muted">No recurring expenses configured. Add a template to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {recurringExpenses.map((re) => (
            <Card key={re.id} className="group relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{re.description || re.category}</p>
                  <p className="text-xs text-text-muted">{re.category} · Day {re.day_of_month}</p>
                </div>
                <span className="text-sm font-bold text-danger">{formatCurrency(re.amount)}</span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-border pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button variant="ghost" size="sm" onClick={() => onGenerate(re)}>
                  <Plus className="h-3.5 w-3.5" />
                  Generate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(re)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(re)}>
                  <span className="text-danger">Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
