import { useState, useMemo } from 'react'
import { Zap, Droplets, Plus, Edit2 } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { formatCurrency, getCurrentMonth, formatMonthYear } from '../lib/utils'
import { Card, CardTitle, Button, Modal, Input, Select, EmptyState } from '../components/ui'
import { SkeletonTable } from '../components/ui/Skeleton'

const UTILITY_TYPES = [
  { value: 'electric', label: 'Electric', icon: Zap, color: 'text-yellow-500' },
  { value: 'water', label: 'Water', icon: Droplets, color: 'text-blue-500' },
]
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

export default function Utilities() {
  const current = getCurrentMonth()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [activeTab, setActiveTab] = useState('electric')
  const [form, setForm] = useState({
    unit_id: '', utility_type: 'electric', previous_reading: 0, current_reading: 0,
    rate_per_unit: 0, reading_date: '', billing_period_month: current.month, billing_period_year: current.year,
  })

  const { data: readings, loading, refetch } = useSupabaseQuery('utility_readings', {
    select: '*, units(unit_number, floor)',
    order: { column: 'reading_date', ascending: false },
    filters: [
      { column: 'utility_type', value: activeTab },
      { column: 'billing_period_month', value: filterMonth },
      { column: 'billing_period_year', value: filterYear },
    ],
  })

  const { data: units } = useSupabaseQuery('units', {
    select: 'id, unit_number, floor',
    order: { column: 'unit_number', ascending: true },
  })

  const { insert, update, loading: mutating } = useSupabaseMutation('utility_readings')

  const stats = useMemo(() => {
    const total = readings.reduce((sum, r) => sum + Number(r.total_cost || 0), 0)
    const totalUnits = new Set(readings.map((r) => r.unit_id)).size
    const totalUsage = readings.reduce((sum, r) => sum + (Number(r.current_reading) - Number(r.previous_reading)), 0)
    return { total, totalUnits, totalUsage, count: readings.length }
  }, [readings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      unit_id: form.unit_id,
      previous_reading: parseFloat(form.previous_reading),
      current_reading: parseFloat(form.current_reading),
      rate_per_unit: parseFloat(form.rate_per_unit),
      billing_period_month: parseInt(form.billing_period_month),
      billing_period_year: parseInt(form.billing_period_year),
      reading_date: form.reading_date || new Date().toISOString().split('T')[0],
    }
    if (editing) {
      await update(editing.id, payload)
    } else {
      await insert(payload)
    }
    setShowModal(false)
    setEditing(null)
    refetch()
  }

  const handleEdit = (reading) => {
    setForm({
      unit_id: reading.unit_id,
      utility_type: reading.utility_type,
      previous_reading: reading.previous_reading,
      current_reading: reading.current_reading,
      rate_per_unit: reading.rate_per_unit,
      reading_date: reading.reading_date || '',
      billing_period_month: reading.billing_period_month,
      billing_period_year: reading.billing_period_year,
    })
    setEditing(reading)
    setShowModal(true)
  }

  const openAdd = () => {
    setForm({
      unit_id: '', utility_type: activeTab, previous_reading: 0, current_reading: 0,
      rate_per_unit: activeTab === 'electric' ? 12 : 50, reading_date: '',
      billing_period_month: filterMonth, billing_period_year: filterYear,
    })
    setEditing(null)
    setShowModal(true)
  }

  const activeIcon = UTILITY_TYPES.find((u) => u.value === activeTab)

  return (
    <div className="space-y-6">
      {/* Utility Type Tabs */}
      <div className="flex gap-3">
        {UTILITY_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.value}
              onClick={() => setActiveTab(type.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === type.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-card border border-border text-text-secondary hover:bg-surface'
              }`}
            >
              <Icon className={`h-4 w-4 ${activeTab === type.value ? 'text-white' : type.color}`} />
              {type.label}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Cost</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Units Billed</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalUnits}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Total Usage</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalUsage.toFixed(1)} {activeTab === 'electric' ? 'kWh' : 'm³'}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Readings</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.count}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>
        <Select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
        <div className="flex-1" />
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Record Reading
        </Button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : readings.length === 0 ? (
        <EmptyState
          icon={activeIcon?.icon || Zap}
          title="No readings found"
          description={`No ${activeTab} readings for ${formatMonthYear(filterMonth, filterYear)}.`}
          action={<Button onClick={openAdd}>Record Reading</Button>}
        />
      ) : (
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
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Edit Reading' : 'Record Reading'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Unit"
            value={form.unit_id}
            onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
            required
          >
            <option value="">Select unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number} (Floor {u.floor})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Previous Reading"
              type="number"
              min="0"
              step="0.1"
              value={form.previous_reading}
              onChange={(e) => setForm({ ...form, previous_reading: e.target.value })}
              required
            />
            <Input
              label="Current Reading"
              type="number"
              min="0"
              step="0.1"
              value={form.current_reading}
              onChange={(e) => setForm({ ...form, current_reading: e.target.value })}
              required
            />
          </div>
          <Input
            label={`Rate per ${activeTab === 'electric' ? 'kWh' : 'cubic meter'} (₱)`}
            type="number"
            min="0"
            step="0.5"
            value={form.rate_per_unit}
            onChange={(e) => setForm({ ...form, rate_per_unit: e.target.value })}
            required
          />
          <Input
            label="Reading Date"
            type="date"
            value={form.reading_date}
            onChange={(e) => setForm({ ...form, reading_date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Billing Month"
              value={form.billing_period_month}
              onChange={(e) => setForm({ ...form, billing_period_month: e.target.value })}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Select
              label="Billing Year"
              value={form.billing_period_year}
              onChange={(e) => setForm({ ...form, billing_period_year: e.target.value })}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
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
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null) }}>Cancel</Button>
            <Button type="submit" disabled={mutating}>{editing ? 'Save Changes' : 'Record Reading'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
