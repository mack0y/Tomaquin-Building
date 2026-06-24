import { Card } from '../ui'
import { formatCurrency, formatMonthYear } from '../../lib/utils'

export default function UnitProfitability({ unitProfitData, filterMonth, filterYear }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Unit Profitability — {formatMonthYear(filterMonth, filterYear)}
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
  )
}
