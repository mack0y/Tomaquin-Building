import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Plus, Zap } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { useNotifications } from '../hooks/useNotifications'
import { getCurrentMonth } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Button, Select } from '../components/ui'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import NotificationsPanel from '../components/dashboard/NotificationsPanel'
import SummaryCards from '../components/dashboard/SummaryCards'
import UnitProfitability from '../components/dashboard/UnitProfitability'
import RecurringExpensesSection from '../components/dashboard/RecurringExpensesSection'
import OccupancyByFloor from '../components/dashboard/OccupancyByFloor'
import RecentPaymentsTable from '../components/dashboard/RecentPaymentsTable'
import {
  PaymentModal,
  ExpenseModal,
  RecurringTemplateModal,
  RecurringDeleteDialog,
  RecurringGenerateDialog,
  MONTHS,
  YEARS,
} from '../components/dashboard/DashboardModals'

const INITIAL_PAYMENT_FORM = { tenant_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], period_month: 0, period_year: 0, status: 'paid', notes: '' }
const INITIAL_EXPENSE_FORM = { category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] }
const INITIAL_RECURRING_FORM = { category: '', description: '', amount: '', day_of_month: 1 }

export default function Dashboard() {
  const current = getCurrentMonth()
  const toast = useToast()
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const prevMonth = filterMonth === 1 ? 12 : filterMonth - 1
  const prevYear = filterMonth === 1 ? filterYear - 1 : filterYear

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [recurringForm, setRecurringForm] = useState(INITIAL_RECURRING_FORM)
  const [paymentForm, setPaymentForm] = useState({ ...INITIAL_PAYMENT_FORM, period_month: current.month, period_year: current.year })
  const [expenseForm, setExpenseForm] = useState(INITIAL_EXPENSE_FORM)
  const [recurringTarget, setRecurringTarget] = useState(null)
  const [deleteRecurringTarget, setDeleteRecurringTarget] = useState(null)

  // Data queries
  const { data: units, loading: unitsLoading, error: unitsError } = useSupabaseQuery('units', {
    order: { column: 'unit_number', ascending: true },
  })
  const { data: tenants, error: tenantsError } = useSupabaseQuery('tenants', {
    select: '*, units(unit_number)',
  })
  const { data: payments, refetch: refetchPayments, error: paymentsError } = useSupabaseQuery('rent_payments', {
    select: '*, tenants(full_name), units(unit_number)',
    order: { column: 'created_at', ascending: false },
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
    ],
  })
  const { data: allPayments } = useSupabaseQuery('rent_payments', {
    select: 'amount, status',
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
    ],
  })
  const { data: prevPayments } = useSupabaseQuery('rent_payments', {
    select: 'amount, status',
    filters: [
      { column: 'period_month', value: prevMonth },
      { column: 'period_year', value: prevYear },
    ],
  })
  const { data: expenses, refetch: refetchExpenses, error: expensesError } = useSupabaseQuery('expenses', {
    order: { column: 'expense_date', ascending: false },
  })
  const { data: utilityReadings, error: utilitiesError } = useSupabaseQuery('utility_readings', {
    select: 'unit_id, total_cost, billing_period_month, billing_period_year',
  })
  const { data: recurringExpenses, refetch: refetchRecurring, error: recurringError } = useSupabaseQuery('recurring_expenses', {
    order: { column: 'category', ascending: true },
  })

  // Mutations
  const { insert: insertPayment } = useSupabaseMutation('rent_payments')
  const { insert: insertExpense } = useSupabaseMutation('expenses')
  const { insert: insertRecurring, update: updateRecurring, remove: removeRecurring } = useSupabaseMutation('recurring_expenses')

  // Notifications
  const { notifications } = useNotifications({
    units, tenants, payments: allPayments, utilityReadings, expenses, recurringExpenses,
    filterMonth, filterYear,
  })

  // Duplicate check for recurring generation
  const recurringDuplicateCounts = useMemo(() => {
    const counts = {}
    recurringExpenses.forEach((re) => {
      const targetDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(re.day_of_month).padStart(2, '0')}`
      counts[re.id] = expenses.filter((e) => e.category === re.category && e.expense_date === targetDate).length
    })
    return counts
  }, [recurringExpenses, expenses, filterMonth, filterYear])

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
      .filter((e) => { const d = new Date(e.expense_date); return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear })
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const prevCollected = prevPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const prevExpenses = expenses
      .filter((e) => { const d = new Date(e.expense_date); return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear })
      .reduce((sum, e) => sum + Number(e.amount), 0)
    const incomeChange = prevCollected > 0 ? (((totalCollected - prevCollected) / prevCollected) * 100).toFixed(0) : null
    const expenseChange = prevExpenses > 0 ? (((monthExpenses - prevExpenses) / prevExpenses) * 100).toFixed(0) : null

    return {
      totalUnits, occupied, vacant,
      occupancyRate: totalUnits > 0 ? ((occupied / totalUnits) * 100).toFixed(0) : 0,
      totalTenants, totalCollected, totalPending, overdueCount,
      monthExpenses, netCashflow: totalCollected - monthExpenses,
      incomeChange, expenseChange,
    }
  }, [units, tenants, allPayments, prevPayments, expenses, filterMonth, filterYear, prevMonth, prevYear])

  // Unit profit data
  const unitProfitData = useMemo(() => {
    if (!units.length) return []
    return units.filter(u => u.status === 'occupied').map(unit => {
      const tenant = tenants.find(t => t.unit_id === unit.id)
      const unitUtilities = utilityReadings
        .filter(r => r.unit_id === unit.id && r.billing_period_month === filterMonth && r.billing_period_year === filterYear)
        .reduce((sum, r) => sum + Number(r.total_cost || 0), 0)
      return {
        unit_number: unit.unit_number, floor: unit.floor,
        rent: Number(unit.rent_amount), utilities: unitUtilities,
        profit: Number(unit.rent_amount) - unitUtilities,
        tenant: tenant?.full_name || 'Vacant',
      }
    })
  }, [units, tenants, utilityReadings, filterMonth, filterYear])

  const recentPayments = payments.slice(0, 8)

  // Handlers
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    const tenant = tenants.find(t => t.id === paymentForm.tenant_id)
    if (!tenant) return toast.error('Please select a tenant')
    const { error } = await insertPayment({
      tenant_id: paymentForm.tenant_id, unit_id: tenant.unit_id,
      amount: parseFloat(paymentForm.amount), payment_date: paymentForm.payment_date,
      period_month: parseInt(paymentForm.period_month), period_year: parseInt(paymentForm.period_year),
      status: paymentForm.status, notes: paymentForm.notes,
    })
    if (error) return toast.error('Failed: ' + error.message)
    toast.success('Payment recorded!')
    setShowPaymentModal(false)
    setPaymentForm({ ...INITIAL_PAYMENT_FORM, period_month: filterMonth, period_year: filterYear })
    refetchPayments()
  }

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    const { error } = await insertExpense({
      category: expenseForm.category, description: expenseForm.description,
      amount: parseFloat(expenseForm.amount), expense_date: expenseForm.expense_date,
    })
    if (error) return toast.error('Failed: ' + error.message)
    toast.success('Expense added!')
    setShowExpenseModal(false)
    setExpenseForm(INITIAL_EXPENSE_FORM)
    refetchExpenses()
  }

  const handleGenerateRecurring = async () => {
    if (!recurringTarget) return
    const { error } = await insertExpense({
      category: recurringTarget.category, description: recurringTarget.description,
      amount: recurringTarget.amount,
      expense_date: `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(recurringTarget.day_of_month).padStart(2, '0')}`,
    })
    if (error) return toast.error('Failed: ' + error.message)
    toast.success(`${recurringTarget.description || recurringTarget.category} generated!`)
    setRecurringTarget(null)
    refetchExpenses()
  }

  const handleRecurringSubmit = async (e) => {
    e.preventDefault()
    if (!recurringForm.category) return toast.error('Please select a category')
    if (!recurringForm.amount) return toast.error('Please enter an amount')
    const payload = {
      category: recurringForm.category, description: recurringForm.description,
      amount: parseFloat(recurringForm.amount), day_of_month: parseInt(recurringForm.day_of_month),
    }
    if (editingRecurring) {
      const { error } = await updateRecurring(editingRecurring.id, payload)
      if (error) return toast.error('Failed to update: ' + error.message)
      toast.success('Template updated!')
    } else {
      const { error } = await insertRecurring(payload)
      if (error) return toast.error('Failed to add: ' + error.message)
      toast.success('Template added!')
    }
    setShowRecurringModal(false)
    setEditingRecurring(null)
    setRecurringForm(INITIAL_RECURRING_FORM)
    refetchRecurring()
  }

  const handleDeleteRecurring = async () => {
    if (!deleteRecurringTarget) return
    const { error } = await removeRecurring(deleteRecurringTarget.id)
    if (error) return toast.error('Failed to delete: ' + error.message)
    toast.success('Template deleted')
    setDeleteRecurringTarget(null)
    refetchRecurring()
  }

  // Loading state
  if (unitsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-36" />)}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const queryError = unitsError || tenantsError || paymentsError || expensesError || utilitiesError || recurringError

  return (
    <div className="space-y-6">
      {queryError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-danger">Failed to load data: {queryError}</p>
        </div>
      )}

      {/* Date Range Filter + Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Select id="dashboard-month" name="dashboard-month" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
        <Select id="dashboard-year" name="dashboard-year" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <div className="flex-1" />
        <Button onClick={() => setShowPaymentModal(true)}>
          <CreditCard className="h-4 w-4" /> Record Payment
        </Button>
        <Button variant="secondary" onClick={() => setShowExpenseModal(true)}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
        <Link to="/utilities">
          <Button variant="secondary">
            <Zap className="h-4 w-4" /> Record Reading
          </Button>
        </Link>
      </div>

      <SummaryCards stats={stats} />
      <NotificationsPanel notifications={notifications} />
      <UnitProfitability unitProfitData={unitProfitData} filterMonth={filterMonth} filterYear={filterYear} />

      <RecurringExpensesSection
        recurringExpenses={recurringExpenses}
        onAdd={() => { setEditingRecurring(null); setRecurringForm(INITIAL_RECURRING_FORM); setShowRecurringModal(true) }}
        onEdit={(re) => { setEditingRecurring(re); setRecurringForm({ category: re.category, description: re.description || '', amount: re.amount, day_of_month: re.day_of_month }); setShowRecurringModal(true) }}
        onDelete={(re) => setDeleteRecurringTarget(re)}
        onGenerate={(re) => setRecurringTarget(re)}
      />

      <OccupancyByFloor units={units} />
      <RecentPaymentsTable recentPayments={recentPayments} filterMonth={filterMonth} filterYear={filterYear} />

      {/* Modals */}
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSubmit={handlePaymentSubmit}
        paymentForm={paymentForm} setPaymentForm={setPaymentForm} tenants={tenants} filterMonth={filterMonth} filterYear={filterYear} />
      <ExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSubmit={handleExpenseSubmit}
        expenseForm={expenseForm} setExpenseForm={setExpenseForm} />
      <RecurringTemplateModal isOpen={showRecurringModal} onClose={() => { setShowRecurringModal(false); setEditingRecurring(null) }}
        onSubmit={handleRecurringSubmit} recurringForm={recurringForm} setRecurringForm={setRecurringForm} editingRecurring={editingRecurring} />
      <RecurringDeleteDialog isOpen={!!deleteRecurringTarget} onClose={() => setDeleteRecurringTarget(null)}
        onConfirm={handleDeleteRecurring} target={deleteRecurringTarget} />
      <RecurringGenerateDialog isOpen={!!recurringTarget} onClose={() => setRecurringTarget(null)}
        onConfirm={handleGenerateRecurring} target={recurringTarget} duplicateCounts={recurringDuplicateCounts}
        filterMonth={filterMonth} filterYear={filterYear} />
    </div>
  )
}
