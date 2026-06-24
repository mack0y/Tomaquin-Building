import { useMemo } from 'react'
import { formatCurrency, formatMonthYear } from '../lib/utils'
import { AlertCircle, Clock, Zap, CalendarDays, FileText } from 'lucide-react'

/**
 * Shared hook for computing notification items.
 * Accepts data as parameters to avoid duplicate queries when used from Dashboard.
 * When used from Sidebar, pass fetched data or use useSupabaseQuery to fetch.
 */
export function useNotifications({ units = [], tenants = [], payments = [], utilityReadings = [], expenses = [], recurringExpenses = [], filterMonth, filterYear }) {
  const today = new Date()

  // Build notification items
  const notifications = useMemo(() => {
    const items = []

    // 1. Overdue payments (critical)
    const overduePayments = payments.filter((p) => p.status === 'overdue')
    if (overduePayments.length > 0) {
      items.push({
        id: 'overdue-payments',
        severity: 'critical',
        icon: AlertCircle,
        title: `${overduePayments.length} Overdue Payment${overduePayments.length > 1 ? 's' : ''}`,
        description: `Total overdue: ${formatCurrency(overduePayments.reduce((s, p) => s + Number(p.amount), 0))}`,
        action: '/payments',
        actionLabel: 'View Payments',
      })
    }

    // 2. Pending rent due this month (warning)
    const pendingPayments = payments.filter((p) => p.status === 'pending')
    if (pendingPayments.length > 0) {
      items.push({
        id: 'pending-rent',
        severity: 'warning',
        icon: Clock,
        title: `${pendingPayments.length} Pending Payment${pendingPayments.length > 1 ? 's' : ''} Due`,
        description: `${formatCurrency(pendingPayments.reduce((s, p) => s + Number(p.amount), 0))} awaiting collection for ${formatMonthYear(filterMonth, filterYear)}`,
        action: '/payments',
        actionLabel: 'Record Payments',
      })
    }

    // 3. Units without utility readings this month (warning)
    const occupiedUnits = units.filter((u) => u.status === 'occupied')
    const unitsWithReadings = new Set(
      utilityReadings
        .filter((r) => r.billing_period_month === filterMonth && r.billing_period_year === filterYear)
        .map((r) => r.unit_id)
    )
    const unitsWithoutReadings = occupiedUnits.filter((u) => !unitsWithReadings.has(u.id))
    if (unitsWithoutReadings.length > 0) {
      items.push({
        id: 'missing-readings',
        severity: 'warning',
        icon: Zap,
        title: `${unitsWithoutReadings.length} Unit${unitsWithoutReadings.length > 1 ? 's' : ''} Missing Utility Readings`,
        description: unitsWithoutReadings.map((u) => `Unit ${u.unit_number}`).join(', ')
        + ` — no readings recorded for ${formatMonthYear(filterMonth, filterYear)}`,
        action: '/utilities',
        actionLabel: 'Record Readings',
      })
    }

    // 4. Expired leases (critical)
    const activeTenants = tenants.filter((t) => t.lease_end)
    const expiredLeases = activeTenants.filter((t) => {
      const endDate = new Date(t.lease_end)
      return endDate < today
    })
    if (expiredLeases.length > 0) {
      items.push({
        id: 'expired-leases',
        severity: 'critical',
        icon: FileText,
        title: `${expiredLeases.length} Expired Lease${expiredLeases.length > 1 ? 's' : ''}`,
        description: expiredLeases.map((t) => `${t.full_name} (Unit ${t.units?.unit_number || 'N/A'}) — expired ${t.lease_end}`).join('; '),
        action: '/tenants',
        actionLabel: 'Review Tenants',
      })
    }

    // 5. Leases expiring within 30 days (info)
    const expiringSoon = activeTenants.filter((t) => {
      const endDate = new Date(t.lease_end)
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 30
    })
    if (expiringSoon.length > 0) {
      items.push({
        id: 'expiring-leases',
        severity: 'info',
        icon: CalendarDays,
        title: `${expiringSoon.length} Lease Expiring Soon`,
        description: expiringSoon.map((t) => `${t.full_name} — ${t.lease_end}`).join('; '),
        action: '/tenants',
        actionLabel: 'Review Tenants',
      })
    }

    // 6. Recurring expenses not yet generated (info)
    const unmatchedRecurring = recurringExpenses.filter((re) => {
      const targetDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(re.day_of_month).padStart(2, '0')}`
      return !expenses.some((e) => e.category === re.category && e.expense_date === targetDate)
    })
    if (unmatchedRecurring.length > 0) {
      items.push({
        id: 'unmatched-recurring',
        severity: 'info',
        icon: FileText,
        title: `${unmatchedRecurring.length} Recurring Expense${unmatchedRecurring.length > 1 ? 's' : ''} Not Generated`,
        description: unmatchedRecurring.map((r) => `${r.description || r.category} (${formatCurrency(r.amount)})`).join(', '),
        action: '/cashflow',
        actionLabel: 'Generate Now',
      })
    }

    return items
  }, [payments, units, utilityReadings, tenants, recurringExpenses, expenses, filterMonth, filterYear])

  const notificationCount = notifications.length

  return { notifications, notificationCount }
}
