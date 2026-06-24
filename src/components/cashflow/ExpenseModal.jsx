import { Modal, Input, Select, Button } from '../ui'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatCurrency } from '../../lib/utils'

const EXPENSE_CATEGORIES = ['Maintenance', 'Repair', 'Salary', 'Supplies', 'Insurance', 'Tax', 'Utilities (Building)', 'Other']

export default function ExpenseModal({ isOpen, onClose, onSubmit, form, setForm, editing, mutating }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
          <option value="">Select category</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Description" placeholder="Optional description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Amount (₱)" type="number" min="0" step="100" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <Input label="Date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutating}>{editing ? 'Save Changes' : 'Add Expense'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export function ExpenseDeleteDialog({ isOpen, onClose, onConfirm, target }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Expense"
      message={`Are you sure you want to delete ${target?.category} — ${formatCurrency(target?.amount || 0)}? This cannot be undone.`}
      confirmLabel="Delete Expense"
    />
  )
}
