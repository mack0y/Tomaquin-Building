import { Modal, Input, Select, Button } from '../ui'

const STATUSES = ['paid', 'pending', 'overdue', 'partial']
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

export default function PaymentModal({ isOpen, onClose, onSubmit, form, setForm, tenants, editing, mutating, onTenantChange }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Payment' : 'Record Payment'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Tenant" value={form.tenant_id} onChange={(e) => onTenantChange(e.target.value)} required>
          <option value="">Select tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.full_name} — Unit {t.units?.unit_number || 'Unassigned'}</option>
          ))}
        </Select>
        <Input label="Amount (₱)" type="number" min="0" step="100" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <Input label="Payment Date" type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Period Month" value={form.period_month} onChange={(e) => setForm({ ...form, period_month: e.target.value })}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <Select label="Period Year" value={form.period_year} onChange={(e) => setForm({ ...form, period_year: e.target.value })}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Input label="Notes" placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutating}>{editing ? 'Save Changes' : 'Record Payment'}</Button>
        </div>
      </form>
    </Modal>
  )
}
