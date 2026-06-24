import { useState, useMemo } from 'react'
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle, Edit2 } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { formatCurrency, getCurrentMonth, formatMonthYear } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Card, CardTitle, Button, StatusBadge, Modal, Input, Select, EmptyState } from '../components/ui'
import { SkeletonTable } from '../components/ui/Skeleton'

const STATUSES = ['paid', 'pending', 'overdue', 'partial']
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

export default function Payments() {
  const current = getCurrentMonth()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    tenant_id: '', unit_id: '', amount: '', payment_date: '',
    period_month: current.month, period_year: current.year, status: 'pending', notes: '',
  })

  const { data: payments, loading, refetch } = useSupabaseQuery('rent_payments', {
    select: '*, tenants(full_name), units(unit_number)',
    order: { column: 'created_at', ascending: false },
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
      ...(filterStatus ? [{ column: 'status', value: filterStatus }] : []),
    ],
  })

  const { data: tenants } = useSupabaseQuery('tenants', {
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
    setForm({
      ...form,
      tenant_id: tenantId,
      unit_id: tenant?.unit_id || '',
      amount: tenant?.units ? '' : form.amount,
    })
  }

  const toast = useToast()

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
      tenant_id: payment.tenant_id,
      unit_id: payment.unit_id,
      amount: payment.amount,
      payment_date: payment.payment_date || '',
      period_month: payment.period_month,
      period_year: payment.period_year,
      status: payment.status,
      notes: payment.notes || '',
    })
    setEditing(payment)
    setShowModal(true)
  }

  const openAdd = () => {
    setForm({
      tenant_id: '', unit_id: '', amount: '', payment_date: '',
      period_month: filterMonth, period_year: filterYear, status: 'pending', notes: '',
    })
    setEditing(null)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-sm text-text-secondary">Paid</p>
          </div>
          <p className="mt-1 text-xl font-bold text-success">{formatCurrency(stats.paid)}</p>
          <p className="text-xs text-text-muted">{stats.paidCount} payments</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-info" />
            <p className="text-sm text-text-secondary">Pending</p>
          </div>
          <p className="mt-1 text-xl font-bold text-info">{formatCurrency(stats.pending)}</p>
          <p className="text-xs text-text-muted">{stats.pendingCount} payments</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger" />
            <p className="text-sm text-text-secondary">Overdue</p>
          </div>
          <p className="mt-1 text-xl font-bold text-danger">{formatCurrency(stats.overdue)}</p>
          <p className="text-xs text-text-muted">{stats.overdueCount} payments</p>
        </Card>
      </div>

      {/* Filters & Actions */}
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
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </Select>
        <div className="flex-1" />
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description={`No payments recorded for ${formatMonthYear(filterMonth, filterYear)}.`}
          action={<Button onClick={openAdd}>Record Payment</Button>}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Tenant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Notes</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-b-0 hover:bg-surface">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{payment.tenants?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">Unit {payment.units?.unit_number || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{payment.payment_date || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                  <td className="px-4 py-3 text-sm text-text-muted max-w-[200px] truncate">{payment.notes || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(payment)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Edit Payment' : 'Record Payment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Tenant"
            value={form.tenant_id}
            onChange={(e) => handleTenantChange(e.target.value)}
            required
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} — Unit {t.units?.unit_number || 'Unassigned'}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (₱)"
            type="number"
            min="0"
            step="100"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label="Payment Date"
            type="date"
            value={form.payment_date}
            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Period Month"
              value={form.period_month}
              onChange={(e) => setForm({ ...form, period_month: e.target.value })}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Select
              label="Period Year"
              value={form.period_year}
              onChange={(e) => setForm({ ...form, period_year: e.target.value })}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
          <Input
            label="Notes"
            placeholder="Optional notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null) }}>Cancel</Button>
            <Button type="submit" disabled={mutating}>{editing ? 'Save Changes' : 'Record Payment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
