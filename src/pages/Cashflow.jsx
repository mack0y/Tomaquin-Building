import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit2, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { formatCurrency, getCurrentMonth, formatMonthYear } from '../lib/utils'
import { Card, Button, Modal, Input, Select, EmptyState } from '../components/ui'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]
const EXPENSE_CATEGORIES = [
  'Maintenance', 'Repair', 'Salary', 'Supplies', 'Insurance', 'Tax', 'Utilities (Building)', 'Other',
]

export default function Cashflow() {
  const current = getCurrentMonth()
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState({
    category: '', description: '', amount: '', expense_date: '',
  })

  // Income: rent payments for the period
  const { data: payments } = useSupabaseQuery('rent_payments', {
    select: 'amount, status',
    filters: [
      { column: 'period_month', value: filterMonth },
      { column: 'period_year', value: filterYear },
    ],
  })

  // All payments for the year (for trend chart)
  const { data: yearlyPayments } = useSupabaseQuery('rent_payments', {
    select: 'amount, period_month, period_year, status',
    filters: [
      { column: 'period_year', value: filterYear },
    ],
  })

  // Expenses for the period (all expenses, filtered client-side by month/year)
  const { data: expenses, refetch: refetchExpenses } = useSupabaseQuery('expenses', {
    order: { column: 'expense_date', ascending: false },
  })

  // All expenses for the year
  const { data: yearlyExpenses } = useSupabaseQuery('expenses', {
    select: 'amount, category, expense_date',
    filters: [],
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
    const totalIncome = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const totalPending = payments
      .filter((p) => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0)
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

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

  const handleExpenseSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      expense_date: expenseForm.expense_date,
    }
    if (editingExpense) {
      await updateExpense(editingExpense.id, payload)
    } else {
      await insertExpense(payload)
    }
    setShowExpenseModal(false)
    setEditingExpense(null)
    setExpenseForm({ category: '', description: '', amount: '', expense_date: '' })
    refetchExpenses()
  }

  const handleEditExpense = (expense) => {
    setExpenseForm({
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount,
      expense_date: expense.expense_date,
    })
    setEditingExpense(expense)
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async (expense) => {
    if (confirm(`Delete expense: ${expense.category} - ${formatCurrency(expense.amount)}?`)) {
      await removeExpense(expense.id)
      refetchExpenses()
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-sm text-text-secondary">Income</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(stats.totalIncome)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-danger" />
            <p className="text-sm text-text-secondary">Expenses</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-danger">{formatCurrency(stats.totalExpenses)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <p className="text-sm text-text-secondary">Net Cashflow</p>
          </div>
          <p className={`mt-1 text-2xl font-bold ${stats.netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(stats.netCashflow)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Pending Collections</p>
          <p className="mt-1 text-2xl font-bold text-warning">{formatCurrency(stats.totalPending)}</p>
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
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">Monthly Trend ({filterYear})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">Expense Breakdown</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-text-muted">No expenses recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Expenses List */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">
          Expenses — {formatMonthYear(filterMonth, filterYear)}
        </h3>
        <Button onClick={() => {
          setExpenseForm({ category: '', description: '', amount: '', expense_date: `${filterYear}-${String(filterMonth).padStart(2, '0')}-01` })
          setEditingExpense(null)
          setShowExpenseModal(true)
        }}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {filteredExpenses.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-text-muted">No expenses for this period</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-border last:border-b-0 hover:bg-surface">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{expense.category}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{expense.description || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-danger">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{expense.expense_date}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense)}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => { setShowExpenseModal(false); setEditingExpense(null) }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <Select
            label="Category"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            required
          >
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input
            label="Description"
            placeholder="Optional description..."
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
          />
          <Input
            label="Amount (₱)"
            type="number"
            min="0"
            step="100"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={expenseForm.expense_date}
            onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowExpenseModal(false); setEditingExpense(null) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutating}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
