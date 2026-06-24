import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CreditCard,
  Zap,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { formatCurrency, getCurrentMonth, formatMonthYear } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Card, StatusBadge, Button, Modal, Input, Select } from '../components/ui'

const FLOORS = [1, 2, 3]
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]
const EXPENSE_CATEGORIES = ['Maintenance', 'Repair', 'Salary', 'Supplies', 'Insurance', 'Tax', 'Utilities (Building)', 'Other']

export default function Dashboard() {
  const current = getCurrentMonth()
  const prevMonth = current.month === 1 ? 12 : current.month - 1
  const prevYear = current.month === 1 ? current.year - 1 : current.year
  const toast = useToast()

  // Quick Action modals
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    tenant_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0],
    period_month: current.month, period_year: current.year, status: 'paid', notes: '',
  })
  const [expenseForm, setExpenseForm] = useState({
    category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0],
  })

  // Data queries
  const { data: units, loading: unitsLoading } = useSupabaseQuery('units', {
    order: { column: 'unit_number', ascending: true },
  })

  const { data: tenants } = useSupabaseQuery('tenants', {
    select: '*, units(unit_number)',
  })

  const { data: payments, refetch: refetchPayments } = useSupabaseQuery('rent_payments', {
    select: '*, tenants(full_name), units(unit_number)',
    order: { column: 'created_at', ascending: false },
    filters: [
      { column: 'period_month', value: current.month },
      { column: 'period_year', value: current.year },
    ],
  })

  const { data: allPayments } = useSupabaseQuery('rent_payments', {
    select: 'amount, status',
    filters: [
      { column: 'period_month', value: current.month },
      { column: 'period_year', value: current.year },
    ],
  })

  const { data: prevPayments } = useSupabaseQuery('rent_payments', {
    select: 'amount, status',
    filters: [
      { column: 'period_month', value: prevMonth },
      { column: 'period_year', value: prevYear },
    ],
  })

  const { data: expenses, refetch: refetchExpenses } = useSupabaseQuery('expenses', {
    order: { column: 'expense_date', ascending: false },
  })

  const { data: utilityReadings } = useSupabaseQuery('utility_readings', {
    select: 'unit_id, total_cost, billing_period_month, billing_period_year',
  })

  const { data: recurringExpenses, refetch: refetchRecurring } = useSupabaseQuery('recurring_expenses', {
    order: { column: 'category', ascending: true },
  })

  const { insert: insertPayment } = useSupabaseMutation('rent_payments')
  const { insert: insertExpense } = useSupabaseMutation('expenses')


  // Stats
  const stats = useMemo(() => {
    const totalUnits = units.length
    const occupied = units.filter((u) => u.status === 'occupied').length
    const vacant = units.filter((u) => u.status === 'vacant').length
    const totalTenants = tenants.length

    const totalCollected = allPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPending = allPayments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0)
    const overdueCount = allPayments.filter((p) => p.status === 'overdue').length

    const monthExpenses = expenses
      .filter((e) => {
        const d = new Date(e.expense_date)
        return d.getMonth() + 1 === current.month && d.getFullYear() === current.year
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Previous month
    const prevCollected = prevPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const prevExpenses = expenses
      .filter((e) => {
        const d = new Date(e.expense_date)
        return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const incomeChange = prevCollected > 0 ? (((totalCollected - prevCollected) / prevCollected) * 100).toFixed(0) : null
    const expenseChange = prevExpenses > 0 ? (((monthExpenses - prevExpenses) / prevExpenses) * 100).toFixed(0) : null

    return {
      totalUnits, occupied, vacant,
      occupancyRate: totalUnits > 0 ? ((occupied / totalUnits) * 100).toFixed(0) : 0,
      totalTenants, totalCollected, totalPending, overdueCount,
      monthExpenses, netCashflow: totalCollected - monthExpenses,
      incomeChange, expenseChange,
      prevCollected, prevExpenses,
    }
  }, [units, tenants, allPayments, prevPayments, expenses, current, prevMonth, prevYear])

  // Unit profit data
  const unitProfitData = useMemo(() => {
    if (!units.length) return []
    return units.filter(u => u.status === 'occupied').map(unit => {
      // Get tenant for this unit
      const tenant = tenants.find(t => t.unit_id === unit.id)
      // Utility costs for this unit (current month)
      const unitUtilities = utilityReadings
        .filter(r => r.unit_id === unit.id && r.billing_period_month === current.month && r.billing_period_year === current.year)
        .reduce((sum, r) => sum + Number(r.total_cost || 0), 0)

      return {
        unit_number: unit.unit_number,
        floor: unit.floor,
        rent: Number(unit.rent_amount),
        utilities: unitUtilities,
        profit: Number(unit.rent_amount) - unitUtilities,
        tenant: tenant?.full_name || 'Vacant',
      }
    })
  }, [units, tenants, utilityReadings, current])

  const recentPayments = payments.slice(0, 8)
  const overduePayments = allPayments.filter((p) => p.status === 'overdue')

  // Quick action handlers
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    const tenant = tenants.find(t => t.id === paymentForm.tenant_id)
    if (!tenant) return toast.error('Please select a tenant')

    try {
      await insertPayment({
        tenant_id: paymentForm.tenant_id,
        unit_id: tenant.unit_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        period_month: parseInt(paymentForm.period_month),
        period_year: parseInt(paymentForm.period_year),
        status: paymentForm.status,
        notes: paymentForm.notes,
      })
      toast.success('Payment recorded!')
      setShowPaymentModal(false)
      setPaymentForm({ tenant_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], period_month: current.month, period_year: current.year, status: 'paid', notes: '' })
      refetchPayments()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    try {
      await insertExpense({
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        expense_date: expenseForm.expense_date,
      })
      toast.success('Expense added!')
      setShowExpenseModal(false)
      setExpenseForm({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] })
      refetchExpenses()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleGenerateRecurring = async (recurring) => {
    if (!confirm(`Generate ${formatCurrency(recurring.amount)} — ${recurring.description || recurring.category} for ${formatMonthYear(current.month, current.year)}?`)) return
    try {
      await insertExpense({
        category: recurring.category,
        description: recurring.description,
        amount: recurring.amount,
        expense_date: `${current.year}-${String(current.month).padStart(2, '0')}-${String(recurring.day_of_month).padStart(2, '0')}`,
      })
      toast.success(`${recurring.description || recurring.category} generated!`)
      refetchExpenses()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  if (unitsLoading) {
    return <div className="flex h-64 items-center justify-center text-text-secondary">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowPaymentModal(true)}>
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
        <Button variant="secondary" onClick={() => setShowExpenseModal(true)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
        <Link to="/utilities">
          <Button variant="secondary">
            <Zap className="h-4 w-4" />
            Record Reading
          </Button>
        </Link>
      </div>

      {/* Summary Cards with Month Comparison */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <p className="text-sm text-text-secondary">Total Units</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalUnits}</p>
          <p className="text-xs text-text-muted">
            {stats.occupied} occupied · {stats.vacant} vacant · {stats.occupancyRate}% rate
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-info" />
            <p className="text-sm text-text-secondary">Total Tenants</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalTenants}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-sm text-text-secondary">Collected</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(stats.totalCollected)}</p>
          {stats.incomeChange !== null && (
            <p className={`text-xs flex items-center gap-1 ${Number(stats.incomeChange) >= 0 ? 'text-success' : 'text-danger'}`}>
              {Number(stats.incomeChange) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(Number(stats.incomeChange))}% vs last month
            </p>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-danger" />
            <p className="text-sm text-text-secondary">Net Cashflow</p>
          </div>
          <p className={`mt-1 text-2xl font-bold ${stats.netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(stats.netCashflow)}
          </p>
          <p className="text-xs text-text-muted">
            Expenses: {formatCurrency(stats.monthExpenses)}
            {stats.expenseChange !== null && (
              <span className={`ml-1 ${Number(stats.expenseChange) >= 0 ? 'text-danger' : 'text-success'}`}>
                {Number(stats.expenseChange) >= 0 ? '↑' : '↓'}{Math.abs(Number(stats.expenseChange))}%
              </span>
            )}
          </p>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overduePayments.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-danger" />
            <p className="font-semibold text-danger">
              {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''}
            </p>
          </div>
          <p className="mt-1 text-sm text-red-700">
            Total overdue: {formatCurrency(overduePayments.reduce((s, p) => s + Number(p.amount), 0))}
          </p>
          <Link to="/payments">
            <Button variant="ghost" size="sm" className="mt-2 text-danger hover:bg-red-100">
              View overdue payments <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Unit Profit View */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Unit Profitability — {formatMonthYear(current.month, current.year)}
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {unitProfitData.length === 0 ? (
            <Card className="col-span-3">
              <p className="py-4 text-center text-text-muted">No occupied units with data</p>
            </Card>
          ) : (
            unitProfitData.map((u) => (
              <Card key={u.unit_number}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">Unit {u.unit_number}</p>
                    <p className="text-xs text-text-muted">{u.tenant}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Profit</p>
                    <p className={`font-bold ${u.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(u.profit)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Rent</span>
                    <span className="text-success">+{formatCurrency(u.rent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Utilities</span>
                    <span className="text-danger">-{formatCurrency(u.utilities)}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Recurring Expenses */}
      {recurringExpenses.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Recurring Expenses
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recurringExpenses.map((re) => (
              <Card key={re.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{re.description || re.category}</p>
                  <p className="text-xs text-text-muted">{re.category} · Day {re.day_of_month}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-danger">{formatCurrency(re.amount)}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleGenerateRecurring(re)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Occupancy by Floor */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Occupancy by Floor
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {FLOORS.map((floor) => {
            const floorUnits = units.filter((u) => u.floor === floor)
            const floorOccupied = floorUnits.filter((u) => u.status === 'occupied').length
            const floorVacant = floorUnits.filter((u) => u.status === 'vacant').length
            const rate = floorUnits.length > 0 ? ((floorOccupied / floorUnits.length) * 100).toFixed(0) : 0
            return (
              <Card key={floor}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text-primary">Floor {floor}</p>
                  <span className="text-sm text-text-secondary">{rate}% occupied</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {floorUnits.map((u) => (
                    <div
                      key={u.id}
                      className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium ${
                        u.status === 'occupied'
                          ? 'bg-green-100 text-green-700'
                          : u.status === 'vacant'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                      title={`Unit ${u.unit_number} - ${u.status}`}
                    >
                      {u.unit_number.slice(-2)}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  {floorOccupied} occupied · {floorVacant} vacant
                </p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Payments */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">
            Recent Payments — {formatMonthYear(current.month, current.year)}
          </h3>
          <Link to="/payments">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="py-6 text-center text-text-muted">No payments recorded this month</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary">Tenant</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary">Unit</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary">Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-b-0">
                    <td className="py-2.5 text-sm font-medium text-text-primary">{p.tenants?.full_name || '—'}</td>
                    <td className="py-2.5 text-sm text-text-secondary">{p.units?.unit_number || '—'}</td>
                    <td className="py-2.5 text-sm font-medium text-text-primary">{formatCurrency(p.amount)}</td>
                    <td className="py-2.5 text-sm text-text-secondary">{p.payment_date || '—'}</td>
                    <td className="py-2.5"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
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
            <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Quick Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <Select label="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} required>
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Description" placeholder="Optional description..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
          <Input label="Amount (₱)" type="number" min="0" step="100" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
          <Input label="Date" type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
