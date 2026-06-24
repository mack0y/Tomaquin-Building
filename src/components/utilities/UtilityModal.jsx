import { Modal, Input, Select, Button } from '../ui'
import { formatCurrency } from '../../lib/utils'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

export default function UtilityModal({ isOpen, onClose, onSubmit, form, setForm, units, editing, mutating, activeTab }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Reading' : 'Record Reading'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Select label="Unit" value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} required>
          <option value="">Select unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>Unit {u.unit_number} (Floor {u.floor})</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Previous Reading" type="number" min="0" step="0.1" value={form.previous_reading} onChange={(e) => setForm({ ...form, previous_reading: e.target.value })} required />
          <Input label="Current Reading" type="number" min="0" step="0.1" value={form.current_reading} onChange={(e) => setForm({ ...form, current_reading: e.target.value })} required />
        </div>
        <Input
          label={`Rate per ${activeTab === 'electric' ? 'kWh' : 'cubic meter'} (₱)`}
          type="number" min="0" step="0.5" value={form.rate_per_unit} onChange={(e) => setForm({ ...form, rate_per_unit: e.target.value })} required
        />
        <Input label="Reading Date" type="date" value={form.reading_date} onChange={(e) => setForm({ ...form, reading_date: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Billing Month" value={form.billing_period_month} onChange={(e) => setForm({ ...form, billing_period_month: e.target.value })}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <Select label="Billing Year" value={form.billing_period_year} onChange={(e) => setForm({ ...form, billing_period_year: e.target.value })}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <div className="rounded-lg bg-surface p-3 text-sm">
          <span className="text-text-secondary">Estimated Cost: </span>
          <span className="font-semibold text-success">
            {formatCurrency(
              (parseFloat(form.current_reading) - parseFloat(form.previous_reading)) * parseFloat(form.rate_per_unit) || 0
            )}
          </span>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutating}>{editing ? 'Save Changes' : 'Record Reading'}</Button>
        </div>
      </form>
    </Modal>
  )
}
