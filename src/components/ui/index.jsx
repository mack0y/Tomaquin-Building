import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface-card p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold text-text-primary', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-surface text-text-primary border border-border hover:bg-surface-card',
    danger: 'bg-danger text-white hover:bg-red-600',
    success: 'bg-success text-white hover:bg-green-600',
    ghost: 'text-text-secondary hover:bg-surface hover:text-text-primary',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function StatusBadge({ status }) {
  const styles = {
    occupied: 'bg-green-100 text-green-800',
    vacant: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
  }

  const labels = {
    occupied: 'Occupied',
    vacant: 'Vacant',
    maintenance: 'Maintenance',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    partial: 'Partial',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      {labels[status] || status}
    </span>
  )
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="mb-4 h-12 w-12 text-text-muted" />}
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Input({ label, className, id, ...props }) {
  const fieldId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined)
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        name={fieldId}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      />
    </div>
  )
}

export function Select({ label, className, id, children, ...props }) {
  const fieldId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined)
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        name={fieldId}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
