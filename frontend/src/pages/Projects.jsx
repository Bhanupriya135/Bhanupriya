import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Edit2, Trash2, Eye, MapPin, Building2, Layers } from 'lucide-react'
import { projectService } from '../services/projectService'
import Modal from '../components/common/Modal'
import StatusBadge from '../components/common/StatusBadge'
import { PageLoader } from '../components/common/LoadingSpinner'
import { formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

const PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Infrastructure']
const CONSTRUCTION_TYPES = ['RCC', 'LoadBearing', 'Steel', 'Pre-fabricated', 'Composite']
const STATUSES = ['planning', 'in_progress', 'estimation_done', 'completed', 'cancelled']

const emptyForm = {
  name: '', client_name: '', project_type: 'Residential', location: '',
  built_up_area: '', floors: 1, construction_type: 'RCC', description: '', status: 'planning',
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { loadProjects() }, [search, filterStatus, filterType])

  const loadProjects = async () => {
    try {
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterType) params.project_type = filterType
      const res = await projectService.getAll(params)
      setProjects(res.data)
    } catch (err) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setEditProject(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (p) => {
    setEditProject(p)
    setForm({
      name: p.name, client_name: p.client_name, project_type: p.project_type,
      location: p.location || '', built_up_area: p.built_up_area || '',
      floors: p.floors || 1, construction_type: p.construction_type || 'RCC',
      description: p.description || '', status: p.status,
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.client_name) {
      toast.error('Project name and client name are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        built_up_area: form.built_up_area ? parseFloat(form.built_up_area) : null,
        floors: parseInt(form.floors) || 1,
      }
      if (editProject) {
        await projectService.update(editProject.id, payload)
        toast.success('Project updated successfully')
      } else {
        await projectService.create(payload)
        toast.success('Project created successfully')
      }
      setShowModal(false)
      loadProjects()
    } catch (err) {
      toast.error(err.message || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await projectService.delete(id)
      toast.success('Project deleted')
      setDeleteConfirm(null)
      loadProjects()
    } catch (err) {
      toast.error('Failed to delete project')
    }
  }

  if (loading) return <PageLoader message="Loading projects..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1 }}
            />
          </div>
          <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-control" style={{ width: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        {projects.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} />
            <h3>No projects found</h3>
            <p>Create your first project to start estimating materials</p>
            <button className="btn btn-primary mt-4" onClick={openCreate}><Plus size={16} /> Create Project</button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Area / Floors</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.construction_type}</div>
                    </td>
                    <td>{p.client_name}</td>
                    <td><span className="badge badge-blue">{p.project_type}</span></td>
                    <td>
                      {p.location ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--text-muted)" />
                          <span style={{ fontSize: 13 }}>{p.location}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{p.built_up_area ? `${p.built_up_area.toLocaleString()} sqft` : '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <Layers size={11} style={{ marginRight: 2 }} />{p.floors || 1} floor{(p.floors || 1) > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(p.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${p.id}`)} title="View">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setDeleteConfirm(p)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editProject ? 'Edit Project' : 'Create New Project'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Skyline Residency" />
            </div>
            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input className="form-control" value={form.client_name} onChange={e => setForm(f => ({...f, client_name: e.target.value}))} placeholder="Client or company name" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <select className="form-control" value={form.project_type} onChange={e => setForm(f => ({...f, project_type: e.target.value}))}>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Construction Type</label>
              <select className="form-control" value={form.construction_type} onChange={e => setForm(f => ({...f, construction_type: e.target.value}))}>
                {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-control" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Whitefield, Bangalore" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Built-up Area (sqft)</label>
              <input type="number" className="form-control" value={form.built_up_area} onChange={e => setForm(f => ({...f, built_up_area: e.target.value}))} placeholder="e.g. 2400" />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Floors</label>
              <input type="number" className="form-control" value={form.floors} min={1} onChange={e => setForm(f => ({...f, floors: e.target.value}))} />
            </div>
          </div>
          {editProject && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief project description..." rows={3} />
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will also delete all associated drawings, estimations, BOQ items, and reports. This action cannot be undone.</p>
      </Modal>
    </div>
  )
}
