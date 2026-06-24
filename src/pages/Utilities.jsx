import { useState, useMemo } from 'react'
import { Zap } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { getCurrentMonth, formatMonthYear } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Button, Select } from '../components/ui'
import UtilityTabs, { UTILITY_TYPES } from '../components/utilities/UtilityTabs'
import UtilityStats from '../components/utilities/UtilityStats'
import UtilityTable from '../components/utilities/UtilityTable'
import UtilityModal from '../components/utilities/UtilityModal'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

const INITIAL_FORM = { unit_id: '', utility_type: 'electric', previous_reading: 0, current_reading: 0, rate_per_unit: 0, reading_date: '', billing_period_month: 0, billing_period_year: 0 }

export default function Utilities() {
  const current = getCurrentMonth()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [activeTab, setActiveTab] = useState('electric')
  const [form, setForm] = useState({ ...INITIAL_FORM, billing_period_month: current.month, billing_period_year: current.year })

  const { data: readings, loading, refetch, error: readingsError } = useSupabaseQuery('utility_readings', {
    select: '*, units(unit_number, floor)',
    order: { column: 'reading_date', ascending: false },
    filters: [
      { column: 'utility_type', value: activeTab },
      { column: 'billing_period_month', value: filterMonth },
      { column: 'billing_period_year', value: filterYear },
    ],
  })

  const { data: units, error: unitsError } = useSupabaseQuery('units', {
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
      previous_reading: parseFloat(form.previous_reading),
      current_reading: parseFloat(form.current_reading),
      rate_per_unit: parseFloat(form.rate_per_unit),
      billing_period_month: parseInt(form.billing_period_month),
      billing_period_year: parseInt(form.billing_period_year),
      reading_date: form.reading_date || new Date().toISOString().split('T')[0],
    }
    if (editing) {
      const { error } = await update(editing.id, payload)
      if (error) return toast.error('Failed to update reading: ' + error.message)
      toast.success('Reading updated successfully')
    } else {
      const { error } = await insert(payload)
      if (error) return toast.error('Failed to record reading: ' + error.message)
      toast.success('Reading recorded successfully')
    }
    setShowModal(false)
    setEditing(null)
    refetch()
  }

  const handleEdit = (reading) => {
    setForm({
      unit_id: reading.unit_id, utility_type: reading.utility_type,
      previous_reading: reading.previous_reading, current_reading: reading.current_reading,
      rate_per_unit: reading.rate_per_unit, reading_date: reading.reading_date || '',
      billing_period_month: reading.billing_period_month, billing_period_year: reading.billing_period_year,
    })
    setEditing(reading)
    setShowModal(true)
  }

  const openAdd = () => {
    setForm({
      ...INITIAL_FORM, utility_type: activeTab,
      rate_per_unit: activeTab === 'electric' ? 12 : 50,
      billing_period_month: filterMonth, billing_period_year: filterYear,
    })
    setEditing(null)
    setShowModal(true)
  }

  const activeIcon = UTILITY_TYPES.find((u) => u.value === activeTab)

  return (
    <div className="space-y-6">
      {(readingsError || unitsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-danger">Failed to load data: {readingsError || unitsError}</p>
        </div>
      )}

      <UtilityTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <UtilityStats stats={stats} activeTab={activeTab} />

      <div className="flex flex-wrap items-center gap-3">
        <Select id="utility-month" name="utility-month" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
        <Select id="utility-year" name="utility-year" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <div className="flex-1" />
        <Button onClick={openAdd}>
          <Zap className="h-4 w-4" /> Record Reading
        </Button>
      </div>

      <UtilityTable readings={readings} loading={loading} filterMonth={filterMonth} filterYear={filterYear}
        activeTab={activeTab} onEdit={handleEdit} onAdd={openAdd} activeIcon={activeIcon} />

      <UtilityModal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null) }} onSubmit={handleSubmit}
        form={form} setForm={setForm} units={units} editing={editing} mutating={mutating} activeTab={activeTab} />
    </div>
  )
}
