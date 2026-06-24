import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { getCurrentMonth, formatMonthYear, formatCurrency } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Button, Select, Input } from '../components/ui'
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
  const [filterMode, setFilterMode] = useState('monthly') // 'monthly' | 'custom'
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [customStart, setCustomStart] = useState(`${current.year}-${String(current.month).padStart(2, '0')}-01`)
  const [customEnd, setCustomEnd] = useState(new Date(current.year, current.month, 0).toISOString().split('T')[0])
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState(INITIAL_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isCustomRange = filterMode === 'custom'
  const customStartDate = isCustomRange ? new Date(customStart) : null
  const customEndDate = isCustomRange ? new Date(customEnd) : null
  const isRangeValid = !isCustomRange || (customStartDate && customEndDate && customStartDate <= customEndDate)

  // Data queries — fetch all when in custom range mode, filtered by year when monthly
  const { data: allPayments, loading: loadingPayments, error: paymentsError } = useSupabaseQuery('rent_payments', {
    select: 'amount, status, payment_date, period_month, period_year',
    filters: isCustomRange ? [] : [{ column: 'period_year', value: filterYear }],
  })

  const { data: allExpenses, loading: loadingExpenses, refetch: refetchExpenses, error: expensesError } = useSupabaseQuery('expenses', {
    order: { column: 'expense_date', ascending: false },
  })

  const { insert: insertExpense, update: updateExpense, remove: removeExpense, loading: mutating } = useSupabaseMutation('expenses')

  // Filter payments by mode
  const filteredPayments = useMemo(() => {
    if (isCustomRange) {
      // Use period_month/period_year to include pending/overdue (no payment_date yet)
      return allPayments.filter((p) => {
        const d = new Date(p.period_year, p.period_month - 1)
        return d >= new Date(customStartDate.getFullYear(), customStartDate.getMonth())
          && d <= new Date(customEndDate.getFullYear(), customEndDate.getMonth())
      })
    }
    return allPayments.filter((p) => p.period_month === filterMonth && p.period_year === filterYear)
  }, [allPayments, isCustomRange, customStartDate, customEndDate, filterMonth, filterYear])

  // Filter expenses by mode
  const filteredExpenses = useMemo(() => {
    if (isCustomRange) {
      return allExpenses.filter((e) => {
        const d = new Date(e.expense_date)
        return d >= customStartDate && d <= customEndDate
      })
    }
    return allExpenses.filter((e) => {
      const d = new Date(e.expense_date)
      return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear
    })
  }, [allExpenses, isCustomRange, customStartDate, customEndDate, filterMonth, filterYear])

  // Summary stats
  const stats = useMemo(() => {
    const totalIncome = filteredPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPending = filteredPayments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    return { totalIncome, totalPending, totalExpenses, netCashflow: totalIncome - totalExpenses }
  }, [filteredPayments, filteredExpenses])

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    if (!isRangeValid) return []
    if (isCustomRange) {
      // For custom range, show per-month breakdown within the range
      const startM = customStartDate.getMonth() + 1
      const startY = customStartDate.getFullYear()
      const endM = customEndDate.getMonth() + 1
      const endY = customEndDate.getFullYear()

      const monthsInRange = []
      let y = startY, m = startM
      while (y < endY || (y === endY && m <= endM)) {
        monthsInRange.push({ year: y, month: m })
        m++
        if (m > 12) { m = 1; y++ }
      }

      return monthsInRange.map(({ year: yr, month: mo }) => {
        const monthPayments = allPayments.filter(
          (p) => p.period_month === mo && p.period_year === yr && p.status === 'paid'
        )
        const monthExpenses = allExpenses.filter((e) => {
          const d = new Date(e.expense_date)
          return d.getMonth() + 1 === mo && d.getFullYear() === yr
        })
        return {
          name: `${MONTHS[mo - 1].label.slice(0, 3)} ${yr.toString().slice(2)}`,
          income: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
        }
      })
    }

    // Monthly mode — show all 12 months of the selected year
    return MONTHS.map((m) => {
      const monthPayments = allPayments.filter(
        (p) => p.period_month === m.value && p.period_year === filterYear && p.status === 'paid'
      )
      const monthExpenses = allExpenses.filter((e) => {
        const d = new Date(e.expense_date)
        return d.getMonth() + 1 === m.value && d.getFullYear() === filterYear
      })
      return {
        name: m.label.slice(0, 3),
        income: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      }
    })
  }, [allPayments, allExpenses, filterYear, isCustomRange, customStartDate, customEndDate])

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const byCategory = {}
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
    })
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  }, [filteredExpenses])

  const loading = loadingPayments || loadingExpenses

  // Period label for display
  const periodLabel = isCustomRange
    ? `${formatMonthYear(new Date(customStart).getMonth() + 1, new Date(customStart).getFullYear())} — ${formatMonthYear(new Date(customEnd).getMonth() + 1, new Date(customEnd).getFullYear())}`
    : formatMonthYear(filterMonth, filterYear)

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
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <Button variant={filterMode === 'monthly' ? 'primary' : 'secondary'} onClick={() => setFilterMode('monthly')}>
                Monthly
              </Button>
              <Button variant={filterMode === 'custom' ? 'primary' : 'secondary'} onClick={() => setFilterMode('custom')}>
                Custom Range
              </Button>
            </div>
            {filterMode === 'monthly' ? (
              <>
                <Select id="cashflow-month" name="cashflow-month" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
                <Select id="cashflow-year" name="cashflow-year" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </>
            ) : (
              <>
                <Input label="From" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-auto" />
                <span className="text-text-secondary mt-6">to</span>
                <Input label="To" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-auto" />
              </>
            )}
          </div>

          {/* Custom Range Summary */}
          {isCustomRange && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                Showing data for {periodLabel}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatCurrency(stats.totalIncome)} income · {formatCurrency(stats.totalExpenses)} expenses · {formatCurrency(stats.netCashflow)} net
              </p>
            </div>
          )}

          <CashflowSummary stats={stats} />

          <CashflowCharts monthlyTrend={monthlyTrend} expenseBreakdown={expenseBreakdown} filterYear={filterYear} isCustomRange={isCustomRange} periodLabel={periodLabel} />

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">
              Expenses — {periodLabel}
            </h3>
            <Button onClick={() => {
              const defaultDate = isCustomRange
                ? customStart
                : `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
              setExpenseForm({ ...INITIAL_FORM, expense_date: defaultDate })
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
