import { useState, useMemo } from 'react'
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { formatCurrency } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Card, CardTitle, Button, StatusBadge, Modal, Input, Select, EmptyState } from '../components/ui'

const FLOORS = [1, 2, 3]
const STATUSES = ['occupied', 'vacant', 'maintenance']

const emptyUnit = {
  unit_number: '',
  floor: 1,
  rent_amount: 5000,
  status: 'vacant',
}

export default function Units() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [form, setForm] = useState(emptyUnit)

  const { data: units, loading, refetch } = useSupabaseQuery('units', {
    order: { column: 'unit_number', ascending: true },
  })

  const { insert, update, remove, loading: mutating } = useSupabaseMutation('units')

  const unitsByFloor = useMemo(() => {
    const grouped = {}
    for (const floor of FLOORS) {
      grouped[floor] = units.filter((u) => u.floor === floor)
    }
    return grouped
  }, [units])

  const stats = useMemo(() => {
    const occupied = units.filter((u) => u.status === 'occupied').length
    const vacant = units.filter((u) => u.status === 'vacant').length
    const maintenance = units.filter((u) => u.status === 'maintenance').length
    return { total: units.length, occupied, vacant, maintenance }
  }, [units])

  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUnit) {
        await update(editingUnit.id, form)
        toast.success('Unit updated successfully')
      } else {
        await insert(form)
        toast.success('Unit added successfully')
      }
    } catch (err) {
      toast.error('Failed to save unit: ' + err.message)
    }
    setShowAddModal(false)
    setEditingUnit(null)
    setForm(emptyUnit)
    refetch()
  }

  const handleEdit = (unit) => {
    setForm({
      unit_number: unit.unit_number,
      floor: unit.floor,
      rent_amount: unit.rent_amount,
      status: unit.status,
    })
    setEditingUnit(unit)
    setShowAddModal(true)
  }

  const handleDelete = async (unit) => {
    if (confirm(`Delete unit ${unit.unit_number}?`)) {
      try {
        await remove(unit.id)
        toast.success('Unit deleted')
      } catch (err) {
        toast.error('Failed to delete unit: ' + err.message)
      }
      refetch()
    }
  }

  const openAddModal = () => {
    setForm(emptyUnit)
    setEditingUnit(null)
    setShowAddModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Units</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Occupied</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.occupied}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Vacant</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.vacant}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Maintenance</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">All Units</h2>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>

      {/* Units by Floor */}
      {loading ? (
        <div className="py-12 text-center text-text-secondary">Loading units...</div>
      ) : units.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No units yet"
          description="Add your first unit to get started."
          action={<Button onClick={openAddModal}>Add Unit</Button>}
        />
      ) : (
        FLOORS.map((floor) => (
          <div key={floor}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Floor {floor}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {unitsByFloor[floor]?.map((unit) => (
                <Card key={unit.id} className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-text-primary">
                        Unit {unit.unit_number}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatCurrency(unit.rent_amount)}/month
                      </p>
                    </div>
                    <StatusBadge status={unit.status} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(unit)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(unit)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingUnit(null)
        }}
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Unit Number"
            placeholder="e.g. 101"
            value={form.unit_number}
            onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
            required
          />
          <Select
            label="Floor"
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: parseInt(e.target.value) })}
          >
            {FLOORS.map((f) => (
              <option key={f} value={f}>
                Floor {f}
              </option>
            ))}
          </Select>
          <Input
            label="Monthly Rent (₱)"
            type="number"
            min="0"
            step="100"
            value={form.rent_amount}
            onChange={(e) =>
              setForm({ ...form, rent_amount: parseFloat(e.target.value) || 0 })
            }
            required
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                setEditingUnit(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutating}>
              {editingUnit ? 'Save Changes' : 'Add Unit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
