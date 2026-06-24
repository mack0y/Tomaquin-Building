import { Card } from '../ui'
import { formatCurrency } from '../../lib/utils'

export default function UtilityStats({ stats, activeTab }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <p className="text-sm text-text-secondary">Total Cost</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-secondary">Units Billed</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalUnits}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-secondary">Total Usage</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">{stats.totalUsage.toFixed(1)} {activeTab === 'electric' ? 'kWh' : 'm³'}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-secondary">Readings</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">{stats.count}</p>
      </Card>
    </div>
  )
}
