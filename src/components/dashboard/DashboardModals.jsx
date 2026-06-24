import { Modal, Input, Select, Button } from '../ui'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatCurrency, formatMonthYear } from '../../lib/utils'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]
const EXPENSE_CATEGORIES = ['Maintenance', 'Repair', 'Salary', 'Supplies', 'Insurance', 'Tax', 'Utilities (Building)', 'Other']

export function PaymentModal({ isOpen, onClose, onSubmit, paymentForm, setPaymentForm, tenants, filterMonth, filterYear }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Tenant" value={paymentForm.tenant_id} onChange={(e) => setPaymentForm({ ...paymentForm, tenant_id: e.target.value })} required>
          <option value="">Select tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name} — Unit {t.units?.unit_number || 'Unassigned'}</option>
          ))}
        </Select>
        <Input label="Amount (₱)" type="number" min="0" step="100" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
        <Input label="Date" type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Period" value={paymentForm.period_month} onChange={(e) => setPaymentForm({ ...paymentForm, period_month: e.target.value })}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <Select label="Year" value={paymentForm.period_year} onChange={(e) => setPaymentForm({ ...paymentForm, period_year: e.target.value })}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <Input label="Notes" placeholder="Optional notes..." value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Record Payment</Button>
        </div>
      </form>
    </Modal>
  )
}

export function ExpenseModal({ isOpen, onClose, onSubmit, expenseForm, setExpenseForm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense">
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} required>
          <option value="">Select category</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Description" placeholder="Optional description..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
        <Input label="Amount (₱)" type="number" min="0" step="100" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
        <Input label="Date" type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} required />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Expense</Button>
        </div>
      </form>
    </Modal>
  )
}

export function RecurringTemplateModal({ isOpen, onClose, onSubmit, recurringForm, setRecurringForm, editingRecurring }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRecurring ? 'Edit Recurring Template' : 'Add Recurring Template'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Category" value={recurringForm.category} onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })} required>
          <option value="">Select category</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Description" placeholder="Optional description..." value={recurringForm.description} onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })} />
        <Input label="Amount (₱)" type="number" min="0" step="100" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} required />
        <Input label="Day of Month" type="number" min="1" max="31" value={recurringForm.day_of_month} onChange={(e) => setRecurringForm({ ...recurringForm, day_of_month: e.target.value })} required />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editingRecurring ? 'Save Changes' : 'Add Template'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export function RecurringDeleteDialog({ isOpen, onClose, onConfirm, target }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Recurring Template"
      message={`Are you sure you want to delete ${target?.description || target?.category}? This cannot be undone.`}
      confirmLabel="Delete"
    />
  )
}

export function RecurringGenerateDialog({ isOpen, onClose, onConfirm, target, duplicateCounts, filterMonth, filterYear }) {
  const current = { month: filterMonth, year: filterYear }
  const count = (target && duplicateCounts[target.id]) || 0

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Generate Recurring Expense"
      message={
        target && (
          <span>
            Generate {formatCurrency(target.amount)} — {target.description || target.category} for {formatMonthYear(current.month, current.year)}?
            {count > 0 && (
              <span className="mt-2 block rounded-md bg-yellow-50 p-2 text-sm text-yellow-800">
                ⚠️ {count} matching expense{count > 1 ? 's' : ''} already {count === 1 ? 'exists' : 'exist'} for this category on this date.
              </span>
            )}
          </span>
        )
      }
      confirmLabel={count > 0 ? 'Generate Anyway' : 'Generate'}
    />
  )
}

export { EXPENSE_CATEGORIES, MONTHS, YEARS }
