import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { getCurrentMonth, formatMonthYear } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Button, Select } from '../components/ui'
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/Skeleton'
import CashflowSummary from '../components/cashflow/CashflowSummary'
import CashflowCharts from '../components/cashflow/CashflowCharts'
import ExpenseTable from '../components/cashflow/ExpenseTable'
import ExpenseModal, { ExpenseDeleteDialog } from '../components/cashflow/ExpenseModal'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]

const INITIAL_FORM = { category: '', description: '', amount: '', expense_date: '' }

export default function Cashflow() {
  const current = getCurrentMonth()
  const toast = useToast()
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState(INITIAL_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Data queries
  const { data: payments, loading: loadingPayments, error: paymentsError } = useSupabaseQuery('rent_payments', {
    select: 'amount, status',
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
    ],
  })
  const { data: yearlyPayments } = useSupabaseQuery('rent_payments', {
    select: 'amount, period_month, period_year, status',
    filters: [{ column: 'period_year', value: filterYear }],
  })
  const { data: expenses, loading: loadingExpenses, refetch: refetchExpenses, error: expensesError } = useSupabaseQuery('expenses', {
    order: { column: 'expense_date', ascending: false },
  })
  const { data: yearlyExpenses } = useSupabaseQuery('expenses', {
    select: 'amount, category, expense_date',
  })

  const { insert: insertExpense, update: updateExpense, remove: removeExpense, loading: mutating } = useSupabaseMutation('expenses')

  // Filtered expenses by month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.expense_date)
      return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear
    })
  }, [expenses, filterMonth, filterYear])

  // Summary stats
  const stats = useMemo(() => {
    const totalIncome = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPending = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    return { totalIncome, totalPending, totalExpenses, netCashflow: totalIncome - totalExpenses }
  }, [payments, filteredExpenses])

  // Monthly trend data for the year
  const monthlyTrend = useMemo(() => {
    return MONTHS.map((m) => {
      const monthPayments = yearlyPayments.filter(
        (p) => p.period_month === m.value && p.period_year === filterYear && p.status === 'paid'
      )
      const monthExpenses = yearlyExpenses.filter((e) => {
        const d = new Date(e.expense_date)
        return d.getMonth() + 1 === m.value && d.getFullYear() === filterYear
      })
      return {
        name: m.label.slice(0, 3),
        income: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      }
    })
  }, [yearlyPayments, yearlyExpenses, filterYear])

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const byCategory = {}
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
    })
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [filteredExpenses])

  const loading = loadingPayments || loadingExpenses

  // Handlers
  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      category: expenseForm.category, description: expenseForm.description,
      amount: parseFloat(expenseForm.amount), expense_date: expenseForm.expense_date,
    }
    if (editingExpense) {
      const { error } = await updateExpense(editingExpense.id, payload)
      if (error) return toast.error('Failed to update expense: ' + error.message)
      toast.success('Expense updated successfully')
    } else {
      const { error } = await insertExpense(payload)
      if (error) return toast.error('Failed to add expense: ' + error.message)
      toast.success('Expense added successfully')
    }
    setShowExpenseModal(false)
    setEditingExpense(null)
    setExpenseForm(INITIAL_FORM)
    refetchExpenses()
  }

  const handleEditExpense = (expense) => {
    setExpenseForm({ category: expense.category, description: expense.description || '', amount: expense.amount, expense_date: expense.expense_date })
    setEditingExpense(expense)
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async () => {
    if (!deleteTarget) return
    const { error } = await removeExpense(deleteTarget.id)
    if (error) return toast.error('Failed to delete expense: ' + error.message)
    toast.success('Expense deleted')
    setDeleteTarget(null)
    refetchExpenses()
  }

  return (
    <div className="space-y-6">
      {(paymentsError || expensesError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-danger">Failed to load data: {paymentsError || expensesError}</p>
        </div>
      )}

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface-card p-6">
                <Skeleton className="mb-4 h-5 w-40" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ))}
          </div>
          <SkeletonTable rows={5} cols={5} />
        </>
      ) : (
        <>
          <CashflowSummary stats={stats} />

          <div className="flex flex-wrap items-center gap-3">
            <Select id="cashflow-month" name="cashflow-month" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            <Select id="cashflow-year" name="cashflow-year" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>

          <CashflowCharts monthlyTrend={monthlyTrend} expenseBreakdown={expenseBreakdown} filterYear={filterYear} />

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">
              Expenses — {formatMonthYear(filterMonth, filterYear)}
            </h3>
            <Button onClick={() => {
              setExpenseForm({ ...INITIAL_FORM, expense_date: `${filterYear}-${String(filterMonth).padStart(2, '0')}-01` })
              setEditingExpense(null)
              setShowExpenseModal(true)
            }}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>

          <ExpenseTable expenses={filteredExpenses} onEdit={handleEditExpense} onDelete={setDeleteTarget} />

          <ExpenseModal isOpen={showExpenseModal} onClose={() => { setShowExpenseModal(false); setEditingExpense(null) }}
            onSubmit={handleExpenseSubmit} form={expenseForm} setForm={setExpenseForm} editing={editingExpense} mutating={mutating} />

          <ExpenseDeleteDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteExpense} target={deleteTarget} />
        </>
      )}
    </div>
  )
}
