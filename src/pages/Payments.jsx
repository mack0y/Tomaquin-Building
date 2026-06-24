import { useState, useMemo } from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { getCurrentMonth, formatMonthYear } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Button, Select } from '../components/ui'
import PaymentStats from '../components/payments/PaymentStats'
import PaymentTable from '../components/payments/PaymentTable'
import PaymentModal from '../components/payments/PaymentModal'

const STATUSES = ['paid', 'pending', 'overdue', 'partial']
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

const INITIAL_FORM = { tenant_id: '', unit_id: '', amount: '', payment_date: '', period_month: 0, period_year: 0, status: 'pending', notes: '' }

export default function Payments() {
  const current = getCurrentMonth()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ ...INITIAL_FORM, period_month: current.month, period_year: current.year })

  const { data: payments, loading, refetch, error: paymentsError } = useSupabaseQuery('rent_payments', {
    select: '*, tenants(full_name), units(unit_number)',
    order: { column: 'created_at', ascending: false },
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
      ...(filterStatus ? [{ column: 'status', value: filterStatus }] : []),
    ],
  })

  const { data: tenants, error: tenantsError } = useSupabaseQuery('tenants', {
    select: '*, units(unit_number)',
    order: { column: 'full_name', ascending: true },
  })

  const { insert, update, loading: mutating } = useSupabaseMutation('rent_payments')

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const paid = payments.filter((p) => p.status === 'paid')
    const pending = payments.filter((p) => p.status === 'pending')
    const overdue = payments.filter((p) => p.status === 'overdue')
    return {
      total,
      paid: paid.reduce((s, p) => s + Number(p.amount), 0),
      pending: pending.reduce((s, p) => s + Number(p.amount), 0),
      overdue: overdue.reduce((s, p) => s + Number(p.amount), 0),
      count: payments.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
    }
  }, [payments])

  const handleTenantChange = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId)
    setForm({ ...form, tenant_id: tenantId, unit_id: tenant?.unit_id || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      period_month: parseInt(form.period_month),
      period_year: parseInt(form.period_year),
      payment_date: form.payment_date || null,
    }
    try {
      if (editing) {
        await update(editing.id, payload)
        toast.success('Payment updated successfully')
      } else {
        await insert(payload)
        toast.success('Payment recorded successfully')
      }
    } catch (err) {
      toast.error('Failed to save payment: ' + err.message)
    }
    setShowModal(false)
    setEditing(null)
    refetch()
  }

  const handleEdit = (payment) => {
    setForm({
      tenant_id: payment.tenant_id, unit_id: payment.unit_id,
      amount: payment.amount, payment_date: payment.payment_date || '',
      period_month: payment.period_month, period_year: payment.period_year,
      status: payment.status, notes: payment.notes || '',
    })
    setEditing(payment)
    setShowModal(true)
  }

  const openAdd = () => {
    setForm({ ...INITIAL_FORM, period_month: filterMonth, period_year: filterYear })
    setEditing(null)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {(paymentsError || tenantsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-danger">Failed to load data: {paymentsError || tenantsError}</p>
        </div>
      )}

      <PaymentStats stats={stats} />

      <div className="flex flex-wrap items-center gap-3">
        <Select id="payment-month" name="payment-month" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
        <Select id="payment-year" name="payment-year" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select id="payment-status" name="payment-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <div className="flex-1" />
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      <PaymentTable payments={payments} loading={loading} filterMonth={filterMonth} filterYear={filterYear} onEdit={handleEdit} onAdd={openAdd} />

      <PaymentModal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null) }} onSubmit={handleSubmit}
        form={form} setForm={setForm} tenants={tenants} editing={editing} mutating={mutating} onTenantChange={handleTenantChange} />
    </div>
  )
}
