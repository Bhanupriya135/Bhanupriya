import React, { useState, useEffect } from 'react'
import { boqService } from '../services/boqService'
import { projectService } from '../services/projectService'
import { ClipboardList, Plus, Edit2, Trash2, Download, RefreshCw } from 'lucide-react'
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatCurrency, formatNumber } from '../utils/formatters'
import toast from 'react-hot-toast'

const emptyItemForm = { description: '', material: '', unit: 'kg', quantity: '', rate: '', remarks: '', category: 'General' }
const UNITS = ['kg', 'bag', 'nos', 'sqft', 'sqm', 'cft', 'cum', 'mtr', 'ltr', 'ton', 'set']
const CATEGORIES = ['Cement', 'Steel', 'Sand', 'Aggregates', 'Masonry', 'Flooring', 'Finishing', 'Woodwork', 'Electrical', 'Plumbing', 'General']

export default function BOQ() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [boqData, setBoqData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    projectService.getAll().then(res => {
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(String(res.data[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) loadBOQ()
  }, [selectedProject])

  const loadBOQ = async () => {
    try {
      const res = await boqService.getByProject(selectedProject)
      setBoqData(res.data)
    } catch { setBoqData(null) }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await boqService.generate(parseInt(selectedProject))
      setBoqData(res.data)
      toast.success('BOQ generated successfully!')
    } catch (err) {
      toast.error(err.message || 'BOQ generation failed. Run estimation first.')
    } finally {
      setGenerating(false)
    }
  }

  const openAdd = () => { setEditItem(null); setItemForm(emptyItemForm); setShowAddModal(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setItemForm({
      description: item.description, material: item.material || '',
      unit: item.unit, quantity: item.quantity, rate: item.rate,
      remarks: item.remarks || '', category: item.category || 'General',
    })
    setShowAddModal(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    if (!itemForm.description || !itemForm.quantity || !itemForm.rate) {
      toast.error('Description, quantity, and rate are required'); return
    }
    setSavingItem(true)
    try {
      if (editItem) {
        await boqService.updateItem(editItem.id, { ...itemForm, quantity: parseFloat(itemForm.quantity), rate: parseFloat(itemForm.rate) })
        toast.success('Item updated')
      } else {
        await boqService.addItem({ ...itemForm, project_id: parseInt(selectedProject), quantity: parseFloat(itemForm.quantity), rate: parseFloat(itemForm.rate) })
        toast.success('Item added')
      }
      setShowAddModal(false)
      loadBOQ()
    } catch (err) {
      toast.error('Save failed')
    } finally {
      setSavingItem(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await boqService.deleteItem(id)
      toast.success('Item removed')
      loadBOQ()
    } catch { toast.error('Delete failed') }
  }

  const printBOQ = () => window.print()

  if (loading) return <PageLoader />

  const items = boqData?.items || []
  const total = boqData?.total_amount || 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bill of Quantities (BOQ)</h1>
          <p className="page-subtitle">Generate, view, and manage project BOQ</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {items.length > 0 && (
            <>
              <button className="btn btn-secondary" onClick={openAdd}><Plus size={16} /> Add Item</button>
              <button className="btn btn-secondary" onClick={printBOQ}><Download size={16} /> Print</button>
            </>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <label className="form-label">Select Project</label>
            <select className="form-control" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || !selectedProject}>
            {generating ? <><LoadingSpinner size={16} color="white" /> Generating...</> : <><ClipboardList size={16} /> Generate BOQ</>}
          </button>
          {items.length > 0 && (
            <button className="btn btn-secondary" onClick={loadBOQ}><RefreshCw size={16} /> Refresh</button>
          )}
        </div>
      </div>

      {/* Category Summary */}
      {boqData?.category_breakdown && Object.keys(boqData.category_breakdown).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {Object.entries(boqData.category_breakdown).map(([cat, amt]) => (
            <div key={cat} style={{
              padding: '8px 14px', background: 'white', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{cat}: </span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(amt)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={40} />
            <h3>No BOQ generated yet</h3>
            <p>Run material estimation first, then click "Generate BOQ"</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sl.No</th>
                    <th>Description</th>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Rate (₹)</th>
                    <th>Amount (₹)</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontSize: 12 }}>{item.sl_no}</td>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>{item.description}</td>
                      <td style={{ fontSize: 13 }}>{item.material || '-'}</td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{item.category}</span></td>
                      <td>{item.unit}</td>
                      <td>{formatNumber(item.quantity)}</td>
                      <td>{formatNumber(item.rate, 0)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 120 }}>{item.remarks || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(item.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--navy)', color: 'white', fontWeight: 700 }}>
                    <td colSpan={7} style={{ padding: '12px 14px', fontSize: 14 }}>TOTAL BOQ VALUE</td>
                    <td style={{ padding: '12px 14px', fontSize: 15 }}>{formatCurrency(total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editItem ? 'Edit BOQ Item' : 'Add BOQ Item'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveItem} disabled={savingItem}>
              {savingItem ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description *</label>
            <input className="form-control" value={itemForm.description} onChange={e => setItemForm(f => ({...f, description: e.target.value}))} placeholder="Supply and installation of..." />
          </div>
          <div className="form-group">
            <label className="form-label">Material</label>
            <input className="form-control" value={itemForm.material} onChange={e => setItemForm(f => ({...f, material: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={itemForm.category} onChange={e => setItemForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit *</label>
            <select className="form-control" value={itemForm.unit} onChange={e => setItemForm(f => ({...f, unit: e.target.value}))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input type="number" className="form-control" value={itemForm.quantity} onChange={e => setItemForm(f => ({...f, quantity: e.target.value}))} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Rate (₹) *</label>
            <input type="number" className="form-control" value={itemForm.rate} onChange={e => setItemForm(f => ({...f, rate: e.target.value}))} step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input className="form-control" value={formatCurrency(parseFloat(itemForm.quantity || 0) * parseFloat(itemForm.rate || 0))} readOnly style={{ background: 'var(--bg-secondary)' }} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Remarks</label>
            <input className="form-control" value={itemForm.remarks} onChange={e => setItemForm(f => ({...f, remarks: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
