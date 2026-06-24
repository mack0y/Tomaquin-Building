import { useState } from 'react'
import { Users, Plus, Edit, Trash2, Phone, Mail } from 'lucide-react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ui/Toast'
import { Card, Button, StatusBadge, Modal, Input, Select, EmptyState } from '../components/ui'
import { SkeletonCard } from '../components/ui/Skeleton'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const emptyTenant = {
  full_name: '',
  phone: '',
  email: '',
  unit_id: '',
  lease_start: '',
  lease_end: '',
}

export default function Tenants() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyTenant)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: tenants, loading, refetch } = useSupabaseQuery('tenants', {
    select: '*, units(unit_number, floor)',
    order: { column: 'full_name', ascending: true },
  })

  const { data: units } = useSupabaseQuery('units', {
    order: { column: 'unit_number', ascending: true },
  })

  const { insert, update, remove, loading: mutating } = useSupabaseMutation('tenants')

  const filtered = tenants.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.includes(search) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toast = useToast()

  const autoUpdateUnitStatus = async (unitId, action, excludeTenantId) => {
    if (!unitId) return
    if (action === 'assign') {
      await supabase.from('units').update({ status: 'occupied' }).eq('id', unitId)
    } else if (action === 'unassign') {
      const { data: otherTenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('unit_id', unitId)
        .neq('id', excludeTenantId || '')
        .limit(1)
      if (!otherTenants || otherTenants.length === 0) {
        await supabase.from('units').update({ status: 'vacant' }).eq('id', unitId)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      unit_id: form.unit_id || null,
      lease_start: form.lease_start || null,
      lease_end: form.lease_end || null,
    }
    try {
      if (editing) {
        if (editing.unit_id !== payload.unit_id) {
          if (editing.unit_id) await autoUpdateUnitStatus(editing.unit_id, 'unassign', editing.id)
          if (payload.unit_id) await autoUpdateUnitStatus(payload.unit_id, 'assign')
        }
        await update(editing.id, payload)
        toast.success('Tenant updated successfully')
      } else {
        await insert(payload)
        if (payload.unit_id) await autoUpdateUnitStatus(payload.unit_id, 'assign')
        toast.success('Tenant added successfully')
      }
    } catch (err) {
      toast.error('Failed to save tenant: ' + err.message)
    }
    setShowModal(false)
    setEditing(null)
    setForm(emptyTenant)
    refetch()
  }

  const handleEdit = (tenant) => {
    setForm({
      full_name: tenant.full_name,
      phone: tenant.phone || '',
      email: tenant.email || '',
      unit_id: tenant.unit_id || '',
      lease_start: tenant.lease_start || '',
      lease_end: tenant.lease_end || '',
    })
    setEditing(tenant)
    setShowModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.unit_id) await autoUpdateUnitStatus(deleteTarget.unit_id, 'unassign', deleteTarget.id)
      await remove(deleteTarget.id)
      toast.success('Tenant deleted')
    } catch (err) {
      toast.error('Failed to delete tenant: ' + err.message)
    }
    setDeleteTarget(null)
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            id="search-tenants"
            name="search-tenants"
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <Button onClick={() => { setForm(emptyTenant); setEditing(null); setShowModal(true) }}>
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Tenant List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants found"
          description={search ? 'Try a different search term.' : 'Add your first tenant to get started.'}
          action={!search && <Button onClick={() => { setForm(emptyTenant); setEditing(null); setShowModal(true) }}>Add Tenant</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tenant) => (
            <Card key={tenant.id} className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{tenant.full_name}</p>
                  <p className="text-sm text-text-secondary">
                    Unit {tenant.units?.unit_number || 'Unassigned'}
                    {tenant.units?.floor ? ` · Floor ${tenant.units.floor}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Phone className="h-3.5 w-3.5" />
                    {tenant.phone}
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Mail className="h-3.5 w-3.5" />
                    {tenant.email}
                  </div>
                )}
                {tenant.lease_start && (
                  <p className="text-xs text-text-muted">
                    Lease: {tenant.lease_start} {tenant.lease_end ? `— ${tenant.lease_end}` : '(ongoing)'}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2 border-t border-border pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(tenant)}>
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(tenant)}>
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null) }}
        title={editing ? 'Edit Tenant' : 'Add Tenant'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" placeholder="Juan Dela Cruz" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <Input label="Phone" placeholder="09171234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" placeholder="juan@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Unit" value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
            <option value="">Unassigned</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>Unit {u.unit_number} (Floor {u.floor})</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lease Start" type="date" value={form.lease_start} onChange={(e) => setForm({ ...form, lease_start: e.target.value })} />
            <Input label="Lease End" type="date" value={form.lease_end} onChange={(e) => setForm({ ...form, lease_end: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null) }}>Cancel</Button>
            <Button type="submit" disabled={mutating}>{editing ? 'Save Changes' : 'Add Tenant'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant"
        message={`Are you sure you want to delete ${deleteTarget?.full_name}? Their unit will be marked as vacant.`}
        confirmLabel="Delete Tenant"
      />
    </div>
  )
}
