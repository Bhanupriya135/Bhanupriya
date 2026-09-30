import React, { useState, useEffect } from 'react'
import { materialService } from '../services/reportService'
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react'
import { PageLoader } from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

const CATEGORIES = ['Cement', 'Steel', 'Sand', 'Aggregates', 'Masonry', 'Flooring', 'Finishing', 'Woodwork', 'Electrical', 'Plumbing']
const UNITS = ['bag', 'kg', 'ton', 'cft', 'sqft', 'sqm', 'nos', 'ltr', 'mtr', 'cum', 'set']
const emptyForm = { name: '', category: 'Cement', unit: 'bag', rate: '', location: 'Bangalore', description: '' }

export default function Materials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { loadMaterials() }, [search, filterCategory])

  const loadMaterials = async () => {
    try {
      const params = {}
      if (search) params.search = search
      if (filterCategory) params.category = filterCategory
      const res = await materialService.getAll(params)
      setMaterials(res.data)
    } catch { toast.error('Failed to load materials') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (m) => {
    setEditItem(m)
    setForm({ name: m.name, category: m.category, unit: m.unit, rate: m.rate, location: m.location || '', description: m.description || '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.rate) { toast.error('Name and rate required'); return }
    setSaving(true)
    try {
      const payload = { ...form, rate: parseFloat(form.rate) }
      if (editItem) {
        await materialService.update(editItem.id, payload)
        toast.success('Material updated')
      } else {
        await materialService.create(payload)
        toast.success('Material added')
      }
      setShowModal(false)
      loadMaterials()
    } catch (err) {
      toast.error('Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await materialService.delete(id)
      toast.success('Material deleted')
      setDeleteConfirm(null)
      loadMaterials()
    } catch { toast.error('Delete failed') }
  }

  if (loading) return <PageLoader />

  const grouped = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Materials Database</h1>
          <p className="page-subtitle">{materials.length} materials in database</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Material</button>
      </div>

      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1 }} />
          </div>
          <select className="form-control" style={{ width: 180 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Category Cards */}
      {filterCategory ? (
        <MaterialTable materials={materials} onEdit={openEdit} onDelete={setDeleteConfirm} />
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card mb-4">
            <div className="card-header">
              <h2 className="card-title">{cat}</h2>
              <span className="badge badge-blue">{items.length} items</span>
            </div>
            <MaterialTable materials={items} onEdit={openEdit} onDelete={setDeleteConfirm} />
          </div>
        ))
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Material' : 'Add Material'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editItem ? 'Update' : 'Add Material'}
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Material Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. OPC Cement 53 Grade" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-control" value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rate (₹) *</label>
            <input type="number" className="form-control" value={form.rate} onChange={e => setForm(f => ({...f, rate: e.target.value}))} placeholder="Price per unit" />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-control" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Material" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>Delete</button></>}>
        <p>Delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}

function MaterialTable({ materials, onEdit, onDelete }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Rate (₹)</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(m => (
            <tr key={m.id}>
              <td style={{ fontWeight: 500 }}>{m.name}</td>
              <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{m.category}</span></td>
              <td>{m.unit}</td>
              <td style={{ fontWeight: 600 }}>₹{m.rate?.toLocaleString()}</td>
              <td style={{ fontSize: 13 }}>{m.location}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => onEdit(m)}><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => onDelete(m)}><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
