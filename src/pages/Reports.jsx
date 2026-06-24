import { useState, useMemo } from 'react'
import { BarChart3, Download, Printer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { useSupabaseQuery } from '../hooks/useSupabase'
import { formatCurrency, getCurrentMonth, formatMonthYear } from '../lib/utils'
import { Card, Button, Select, Input } from '../components/ui'
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/Skeleton'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('en', { month: 'long' }) }))
const YEARS = [2025, 2026, 2027, 2028]
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Reports() {
  const current = getCurrentMonth()
  const [reportType, setReportType] = useState('yearly')
  const [filterMonth, setFilterMonth] = useState(current.month)
  const [filterYear, setFilterYear] = useState(current.year)
  const [customStart, setCustomStart] = useState(`${current.year}-${String(current.month).padStart(2, '0')}-01`)
  const [customEnd, setCustomEnd] = useState(new Date(current.year, current.month, 0).toISOString().split('T')[0])

  // All payments for the year (or custom range)
  const { data: allPayments, loading: loadingPayments, error: paymentsError } = useSupabaseQuery('rent_payments', {
    select: 'amount, status, period_month, period_year, payment_date',
    filters: reportType === 'custom' ? [] : [{ column: 'period_year', value: filterYear }],
  })

  // All expenses for the year (or custom range)
  const { data: allExpenses, loading: loadingExpenses, error: expensesError } = useSupabaseQuery('expenses', {
    select: 'amount, category, expense_date',
  })

  // Units
  const { data: units, loading: loadingUnits, error: unitsError } = useSupabaseQuery('units', {
    select: 'id, status, floor',
  })

  // Custom range filtering
  const isCustomRange = reportType === 'custom'
  const customStartDate = isCustomRange ? new Date(customStart) : null
  const customEndDate = isCustomRange ? new Date(customEnd) : null

  // Filter payments/expenses by custom range if needed
  const filteredPayments = useMemo(() => {
    if (!isCustomRange) return allPayments
    return allPayments.filter((p) => {
      const d = p.payment_date ? new Date(p.payment_date) : null
      return d && d >= customStartDate && d <= customEndDate
    })
  }, [allPayments, isCustomRange, customStartDate, customEndDate])

  const filteredExpensesForRange = useMemo(() => {
    if (!isCustomRange) return allExpenses
    return allExpenses.filter((e) => {
      const d = new Date(e.expense_date)
      return d >= customStartDate && d <= customEndDate
    })
  }, [allExpenses, isCustomRange, customStartDate, customEndDate])

  // Monthly data
  const monthlyData = useMemo(() => {
    if (isCustomRange) {
      // For custom range, create a single aggregated entry
      const totalPaid = filteredPayments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
      const totalExpected = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalExpenses = filteredExpensesForRange.reduce((sum, e) => sum + Number(e.amount), 0)
      return [{
        name: `${customStart} — ${customEnd}`,
        month: 0,
        income: totalPaid,
        expected: totalExpected,
        expenses: totalExpenses,
        net: totalPaid - totalExpenses,
        collectionRate: totalExpected > 0 ? ((totalPaid / totalExpected) * 100).toFixed(0) : 0,
      }]
    }
    return MONTHS.map((m) => {
      const monthPayments = allPayments.filter(
        (p) => p.period_month === m.value && p.period_year === filterYear && p.status === 'paid'
      )
      const monthAllPayments = allPayments.filter(
        (p) => p.period_month === m.value && p.period_year === filterYear
      )
      const monthExpenses = allExpenses.filter((e) => {
        const d = new Date(e.expense_date)
        return d.getMonth() + 1 === m.value && d.getFullYear() === filterYear
      })
      const totalPaid = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalExpected = monthAllPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
      return {
        name: m.label.slice(0, 3),
        month: m.value,
        income: totalPaid,
        expected: totalExpected,
        expenses: totalExpenses,
        net: totalPaid - totalExpenses,
        collectionRate: totalExpected > 0 ? ((totalPaid / totalExpected) * 100).toFixed(0) : 0,
      }
    })
  }, [allPayments, allExpenses, filterYear, isCustomRange, filteredPayments, filteredExpensesForRange, customStart, customEnd])

  // Selected month detail
  const monthDetail = useMemo(() => {
    if (isCustomRange) return monthlyData[0] || { income: 0, expenses: 0, net: 0, collectionRate: 0 }
    const m = monthlyData.find((d) => d.month === filterMonth)
    return m || { income: 0, expenses: 0, net: 0, collectionRate: 0 }
  }, [monthlyData, filterMonth, isCustomRange])

  // Totals
  const yearlyTotals = useMemo(() => {
    if (isCustomRange) {
      return {
        totalIncome: monthDetail.income,
        totalExpenses: monthDetail.expenses,
        net: monthDetail.net,
        avgCollection: parseFloat(monthDetail.collectionRate) || 0,
      }
    }
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
    const avgCollection = monthlyData.reduce((sum, m) => sum + parseFloat(m.collectionRate), 0) / 12
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses, avgCollection }
  }, [monthlyData, isCustomRange, monthDetail])

  // Expense breakdown
  const yearlyExpenseBreakdown = useMemo(() => {
    const source = isCustomRange ? filteredExpensesForRange : allExpenses
    const byCategory = {}
    source
      .filter((e) => {
        if (isCustomRange) return true
        return new Date(e.expense_date).getFullYear() === filterYear
      })
      .forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
      })
    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [allExpenses, filterYear, isCustomRange, filteredExpensesForRange])

  // Occupancy stats
  const occupancy = useMemo(() => {
    if (!units.length) return { total: 0, occupied: 0, rate: 0 }
    const occupied = units.filter((u) => u.status === 'occupied').length
    return { total: units.length, occupied, rate: ((occupied / units.length) * 100).toFixed(0) }
  }, [units])

  const handleExportCSV = () => {
    const headers = ['Month', 'Income', 'Expenses', 'Net', 'Collection Rate']
    const rows = monthlyData.map((m) => [
      m.name, m.income, m.expenses, m.net, `${m.collectionRate}%`
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tomaquin-report-${isCustomRange ? `${customStart}-to-${customEnd}` : filterYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loading = loadingPayments || loadingExpenses || loadingUnits

  return (
    <div className="space-y-6">
      {loading ? (
        <>
          {/* Filters Skeleton */}
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-28" />)}
          </div>
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* Charts Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="mb-4 h-5 w-48" />
                <Skeleton className="h-[300px] w-full" />
              </Card>
            ))}
          </div>
          {/* Table Skeleton */}
          <SkeletonTable rows={12} cols={5} />
        </>
      ) : (
      <>
      {/* Error Banner */}
      {(paymentsError || expensesError || unitsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-danger">
            Failed to load data: {paymentsError || expensesError || unitsError}
          </p>
        </div>
      )}

      {/* Report Type & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <Button
            variant={reportType === 'monthly' ? 'primary' : 'secondary'}
            onClick={() => setReportType('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={reportType === 'yearly' ? 'primary' : 'secondary'}
            onClick={() => setReportType('yearly')}
          >
            Yearly
          </Button>
          <Button
            variant={reportType === 'custom' ? 'primary' : 'secondary'}
            onClick={() => setReportType('custom')}
          >
            Custom Range
          </Button>
        </div>
        {reportType === 'monthly' && (
          <Select id="report-month" name="report-month" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        )}
        {reportType === 'custom' ? (
          <>
            <Input
              label="From"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-auto"
            />
            <span className="text-text-secondary mt-6">to</span>
            <Input
              label="To"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-auto"
            />
          </>
        ) : (
          <Select id="report-year" name="report-year" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        )}
        <div className="flex-1" />
        <Button variant="secondary" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Custom Range Summary */}
      {isCustomRange && (
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">
            {formatMonthYear(new Date(customStart).getMonth() + 1, new Date(customStart).getFullYear())} — {formatMonthYear(new Date(customEnd).getMonth() + 1, new Date(customEnd).getFullYear())} Summary
          </h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-text-secondary">Income Collected</p>
              <p className="text-xl font-bold text-success">{formatCurrency(monthDetail.income)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Expenses</p>
              <p className="text-xl font-bold text-danger">{formatCurrency(monthDetail.expenses)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Net</p>
              <p className={`text-xl font-bold ${monthDetail.net >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(monthDetail.net)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Collection Rate</p>
              <p className="text-xl font-bold text-primary">{monthDetail.collectionRate}%</p>
            </div>
          </div>
        </Card>
      )}

      {/* Yearly Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(yearlyTotals.totalIncome)}</p>
          <p className="text-xs text-text-muted">{isCustomRange ? 'Custom Range' : filterYear}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold text-danger">{formatCurrency(yearlyTotals.totalExpenses)}</p>
          <p className="text-xs text-text-muted">{isCustomRange ? 'Custom Range' : filterYear}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Net Profit</p>
          <p className={`mt-1 text-2xl font-bold ${yearlyTotals.net >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(yearlyTotals.net)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Avg Collection Rate</p>
          <p className="mt-1 text-2xl font-bold text-primary">{yearlyTotals.avgCollection.toFixed(0)}%</p>
          <p className="text-xs text-text-muted">Occupancy: {occupancy.rate}% ({occupancy.occupied}/{occupancy.total})</p>
        </Card>
      </div>

      {/* Monthly Report Detail */}
      {reportType === 'monthly' && (
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">
            {formatMonthYear(filterMonth, filterYear)} — Summary
          </h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-text-secondary">Income Collected</p>
              <p className="text-xl font-bold text-success">{formatCurrency(monthDetail.income)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Expenses</p>
              <p className="text-xl font-bold text-danger">{formatCurrency(monthDetail.expenses)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Net</p>
              <p className={`text-xl font-bold ${monthDetail.net >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(monthDetail.net)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Collection Rate</p>
              <p className="text-xl font-bold text-primary">{monthDetail.collectionRate}%</p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses */}
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">Revenue vs Expenses ({isCustomRange ? 'Custom Range' : filterYear})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Net Cashflow Trend */}
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">Net Cashflow Trend ({isCustomRange ? 'Custom Range' : filterYear})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="net" name="Net Cashflow" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">Expense Breakdown ({isCustomRange ? 'Custom Range' : filterYear})</h3>
          {yearlyExpenseBreakdown.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-text-muted">No expenses recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={yearlyExpenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {yearlyExpenseBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Collection Rate */}
        <Card>
          <h3 className="mb-4 font-semibold text-text-primary">Collection Rate ({isCustomRange ? 'Custom Range' : filterYear})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="collectionRate" name="Collection Rate %" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Table */}
      {!isCustomRange && (
      <Card>
        <h3 className="mb-4 font-semibold text-text-primary">Monthly Summary Table ({filterYear})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Month</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Income</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Expenses</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Net</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Collection Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month} className="border-b border-border last:border-b-0 hover:bg-surface">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{MONTHS[m.month - 1]?.label}</td>
                  <td className="px-4 py-3 text-right text-sm text-success">{formatCurrency(m.income)}</td>
                  <td className="px-4 py-3 text-right text-sm text-danger">{formatCurrency(m.expenses)}</td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${m.net >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(m.net)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">{m.collectionRate}%</td>
                </tr>
              ))}
              <tr className="bg-surface font-semibold">
                <td className="px-4 py-3 text-sm text-text-primary">Total</td>
                <td className="px-4 py-3 text-right text-sm text-success">{formatCurrency(yearlyTotals.totalIncome)}</td>
                <td className="px-4 py-3 text-right text-sm text-danger">{formatCurrency(yearlyTotals.totalExpenses)}</td>
                <td className={`px-4 py-3 text-right text-sm ${yearlyTotals.net >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(yearlyTotals.net)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-primary">{yearlyTotals.avgCollection.toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      )}
      </>
      )}
    </div>
  )
}
