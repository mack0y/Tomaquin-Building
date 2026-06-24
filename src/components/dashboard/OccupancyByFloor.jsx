import { Card } from '../ui'

const FLOORS = [1, 2, 3]

export default function OccupancyByFloor({ units }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Occupancy by Floor
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {FLOORS.map((floor) => {
          const floorUnits = units.filter((u) => u.floor === floor)
          const floorOccupied = floorUnits.filter((u) => u.status === 'occupied').length
          const floorVacant = floorUnits.filter((u) => u.status === 'vacant').length
          const rate = floorUnits.length > 0 ? ((floorOccupied / floorUnits.length) * 100).toFixed(0) : 0
          return (
            <Card key={floor}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-text-primary">Floor {floor}</p>
                <span className="text-sm text-text-secondary">{rate}% occupied</span>
              </div>
              <div className="mt-3 flex gap-2">
                {floorUnits.map((u) => (
                  <div
                    key={u.id}
                    className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium ${
                      u.status === 'occupied'
                        ? 'bg-green-100 text-green-700'
                        : u.status === 'vacant'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                    title={`Unit ${u.unit_number} - ${u.status}`}
                  >
                    {u.unit_number.slice(-2)}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {floorOccupied} occupied · {floorVacant} vacant
              </p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
