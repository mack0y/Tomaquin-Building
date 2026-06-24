import { Link } from 'react-router-dom'
import { Bell, ArrowRight } from 'lucide-react'
import { Button } from '../ui'

const severityStyles = {
  critical: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const iconStyles = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

const buttonStyles = {
  critical: 'text-red-700 hover:bg-red-100',
  warning: 'text-amber-700 hover:bg-amber-100',
  info: 'text-blue-700 hover:bg-blue-100',
}

export default function NotificationsPanel({ notifications }) {
  if (!notifications.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-text-secondary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Action Required ({notifications.length})
        </h3>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = n.icon
          return (
            <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-3 ${severityStyles[n.severity]}`}>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconStyles[n.severity]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs opacity-80 truncate">{n.description}</p>
              </div>
              <Link to={n.action} className="shrink-0">
                <Button variant="ghost" size="sm" className={`text-xs ${buttonStyles[n.severity]}`}>
                  {n.actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
