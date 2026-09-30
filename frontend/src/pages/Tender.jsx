import React, { useState, useEffect } from 'react'
import { projectService } from '../services/projectService'
import { tenderService } from '../services/tenderService'
import {
  FileText, Plus, Edit2, Trash2, Download, RefreshCw,
  CheckCircle, Clock, XCircle, Send, Eye
} from 'lucide-react'
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: '#64748b', bg: '#f1f5f9' },
  sent:     { label: 'Sent',     color: '#0ea5e9', bg: '#f0f9ff' },
  accepted: { label: 'Accepted', color: '#22c55e', bg: '#f0fdf4' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
}

const defaultForm = {
  project_id: '',
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_gstin: '',
  company_license: '',
  tender_no: '',
  validity_days: 30,
  delivery_days: 90,
  quoted_amount: '',
  discount_percent: 0,
  advance_percent: 20,
  scope_of_work: '',
  payment_terms: '',
  special_conditions: '',
  exclusions: '',
  notes: '',
}

export default function Tender() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTender, setEditTender] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewTender, setViewTender] = useState(null)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    projectService.getAll().then(res => {
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(String(res.data[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) loadTenders()
  }, [selectedProject])

  const loadTenders = async () => {
    try {
      const res = await tenderService.getByProject(selectedProject)
      setTenders(res.data)
    } catch { setTenders([]) }
  }

  const openCreate = () => {
    const proj = projects.find(p => p.id === parseInt(selectedProject))
    setEditTender(null)
    setForm({
      ...defaultForm,
      project_id: parseInt(selectedProject),
      company_name: '',
    })
    setShowModal(true)
  }

  const openEdit = (t) => {
    setEditTender(t)
    setForm({
      project_id: t.project_id,
      company_name: t.company_name || '',
      company_address: t.company_address || '',
      company_phone: t.company_phone || '',
      company_email: t.company_email || '',
      company_gstin: t.company_gstin || '',
      company_license: t.company_license || '',
      tender_no: t.tender_no || '',
      validity_days: t.validity_days || 30,
      delivery_days: t.delivery_days || 90,
      quoted_amount: t.quoted_amount || '',
      discount_percent: t.discount_percent || 0,
      advance_percent: t.advance_percent || 20,
      scope_of_work: t.scope_of_work || '',
      payment_terms: t.payment_terms || '',
      special_conditions: t.special_conditions || '',
      exclusions: t.exclusions || '',
      notes: t.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.company_name) { toast.error('Company name is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        project_id: parseInt(selectedProject),
        quoted_amount: form.quoted_amount ? parseFloat(form.quoted_amount) : null,
        discount_percent: parseFloat(form.discount_percent) || 0,
        advance_percent: parseFloat(form.advance_percent) || 20,
        validity_days: parseInt(form.validity_days) || 30,
        delivery_days: parseInt(form.delivery_days) || 90,
      }
      if (editTender) {
        await tenderService.update(editTender.id, payload)
        toast.success('Tender updated')
      } else {
        await tenderService.create(payload)
        toast.success('Tender created successfully!')
      }
      setShowModal(false)
      loadTenders()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await tenderService.delete(id)
      toast.success('Tender deleted')
      setDeleteConfirm(null)
      loadTenders()
    } catch { toast.error('Delete failed') }
  }

  const handleRefresh = async (id) => {
    try {
      await tenderService.refresh(id)
      toast.success('Tender data refreshed with latest project data')
      loadTenders()
    } catch { toast.error('Refresh failed') }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await tenderService.update(id, { status })
      toast.success(`Tender marked as ${status}`)
      loadTenders()
    } catch { toast.error('Update failed') }
  }

  const handleDownloadPdf = (id) => {
    setDownloading(id)
    const url = tenderService.downloadPdf(id)
    window.open(url, '_blank')
    setTimeout(() => setDownloading(null), 2000)
  }

  if (loading) return <PageLoader />

  const project = projects.find(p => p.id === parseInt(selectedProject))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tender / Quotation</h1>
          <p className="page-subtitle">Generate professional tender documents for clients</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} disabled={!selectedProject}>
          <Plus size={16} /> New Tender
        </button>
      </div>

      {/* Project Selector */}
      <div className="card mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Project</label>
          <select className="form-control" style={{ maxWidth: 440 }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">-- Select Project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>
            ))}
          </select>
        </div>
        {project && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Client', value: project.client_name },
              { label: 'Type', value: project.project_type },
              { label: 'Area', value: `${(project.built_up_area || 0).toLocaleString()} sqft` },
              { label: 'Status', value: project.status?.replace('_', ' ') },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '5px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenders List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Tender Documents ({tenders.length})</h2>
        </div>

        {tenders.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <h3>No tenders yet</h3>
            <p>Create a tender document to send a formal quotation to your client</p>
            <button className="btn btn-primary mt-4" onClick={openCreate} disabled={!selectedProject}>
              <Plus size={16} /> Create Tender
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tenders.map(t => {
              const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft
              const finalAmt = (t.quoted_amount || 0) * (1 - (t.discount_percent || 0) / 100)
              return (
                <div key={t.id} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  {/* Status indicator */}
                  <div style={{
                    width: 4, alignSelf: 'stretch', borderRadius: 4,
                    background: sc.color, flexShrink: 0,
                    minHeight: 60,
                  }} />

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{t.company_name}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: sc.bg, color: sc.color,
                      }}>{sc.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>No: {t.tender_no}</span>
                      <span>Date: {formatDate(t.tender_date)}</span>
                      <span>Valid: {t.validity_days} days</span>
                      <span>Delivery: {t.delivery_days} days</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{formatCurrency(finalAmt)}</div>
                    {t.discount_percent > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--success)' }}>
                        {t.discount_percent}% discount applied
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Advance: {t.advance_percent}%
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewTender(t)} title="View">
                      <Eye size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDownloadPdf(t.id)}
                      disabled={downloading === t.id}
                      title="Download PDF"
                    >
                      {downloading === t.id ? <LoadingSpinner size={13} color="white" /> : <Download size={13} />}
                      PDF
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRefresh(t.id)} title="Refresh data">
                      <RefreshCw size={13} />
                    </button>

                    {/* Status actions */}
                    {t.status === 'draft' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(t.id, 'sent')}>
                        <Send size={13} /> Send
                      </button>
                    )}
                    {t.status === 'sent' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(t.id, 'accepted')}>
                          <CheckCircle size={13} /> Accept
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(t.id, 'rejected')}>
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}

                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setDeleteConfirm(t)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTender ? 'Edit Tender' : 'Create New Tender'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editTender ? 'Update Tender' : 'Create Tender'}
            </button>
          </>
        }
      >
        <TenderForm form={form} setForm={setForm} />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewTender}
        onClose={() => setViewTender(null)}
        title={`Tender — ${viewTender?.company_name}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setViewTender(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { handleDownloadPdf(viewTender.id); setViewTender(null) }}>
              <Download size={14} /> Download PDF
            </button>
          </div>
        }
      >
        {viewTender && <TenderPreview tender={viewTender} />}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Tender"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
          </>
        }
      >
        <p>Delete tender <strong>{deleteConfirm?.tender_no}</strong> for <strong>{deleteConfirm?.company_name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}


function TenderForm({ form, setForm }) {
  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div>
      {/* Company Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
          Company / Contractor Details
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input className="form-control" value={form.company_name} onChange={f('company_name')} placeholder="Your company name" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.company_phone} onChange={f('company_phone')} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" value={form.company_email} onChange={f('company_email')} placeholder="company@email.com" type="email" />
          </div>
          <div className="form-group">
            <label className="form-label">GSTIN</label>
            <input className="form-control" value={form.company_gstin} onChange={f('company_gstin')} placeholder="29XXXXX1234X1ZX" />
          </div>
          <div className="form-group">
            <label className="form-label">Contractor License No.</label>
            <input className="form-control" value={form.company_license} onChange={f('company_license')} placeholder="License number" />
          </div>
          <div className="form-group">
            <label className="form-label">Tender No.</label>
            <input className="form-control" value={form.tender_no} onChange={f('tender_no')} placeholder="Auto-generated if empty" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Company Address</label>
          <textarea className="form-control" value={form.company_address} onChange={f('company_address')} rows={2} placeholder="Full address..." />
        </div>
      </div>

      {/* Financial Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
          Financial Terms
        </div>
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          <div className="form-group">
            <label className="form-label">Quoted Amount (₹)</label>
            <input type="number" className="form-control" value={form.quoted_amount} onChange={f('quoted_amount')} placeholder="Auto from cost est." />
          </div>
          <div className="form-group">
            <label className="form-label">Discount (%)</label>
            <input type="number" className="form-control" value={form.discount_percent} onChange={f('discount_percent')} min={0} max={50} step={0.5} />
          </div>
          <div className="form-group">
            <label className="form-label">Advance (%)</label>
            <input type="number" className="form-control" value={form.advance_percent} onChange={f('advance_percent')} min={0} max={100} />
          </div>
          <div className="form-group">
            <label className="form-label">Validity (days)</label>
            <input type="number" className="form-control" value={form.validity_days} onChange={f('validity_days')} min={1} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Delivery Duration (working days)</label>
          <input type="number" className="form-control" style={{ maxWidth: 200 }} value={form.delivery_days} onChange={f('delivery_days')} min={1} />
        </div>
      </div>

      {/* Scope & Terms */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
          Scope & Terms (optional — defaults auto-filled)
        </div>
        <div className="form-group">
          <label className="form-label">Scope of Work</label>
          <textarea className="form-control" value={form.scope_of_work} onChange={f('scope_of_work')} rows={3} placeholder="Describe what is included in this tender..." />
        </div>
        <div className="form-group">
          <label className="form-label">Payment Terms</label>
          <textarea className="form-control" value={form.payment_terms} onChange={f('payment_terms')} rows={3} placeholder="Payment schedule and conditions..." />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Special Conditions</label>
            <textarea className="form-control" value={form.special_conditions} onChange={f('special_conditions')} rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Exclusions</label>
            <textarea className="form-control" value={form.exclusions} onChange={f('exclusions')} rows={2} placeholder="What is NOT included..." />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Internal Notes</label>
          <textarea className="form-control" value={form.notes} onChange={f('notes')} rows={2} />
        </div>
      </div>
    </div>
  )
}


function TenderPreview({ tender }) {
  const td = tender.tender_data || {}
  const proj = td.project || {}
  const cost = td.cost_estimation || {}
  const boq = td.boq || []
  const finalAmt = (tender.quoted_amount || 0) * (1 - (tender.discount_percent || 0) / 100)
  const sc = STATUS_CONFIG[tender.status] || STATUS_CONFIG.draft

  return (
    <div style={{ fontSize: 13 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy), var(--primary-dark))',
        color: 'white', padding: '20px 24px', borderRadius: 10, marginBottom: 16,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{tender.company_name}</div>
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{tender.company_address}</div>
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          <span>No: {tender.tender_no}</span>
          <span>Date: {formatDate(tender.tender_date)}</span>
          <span>Valid: {tender.validity_days} days</span>
          <span style={{ padding: '1px 8px', borderRadius: 12, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
        </div>
      </div>

      {/* Project Info */}
      <PreviewSection title="Project Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Client', proj.client], ['Project', proj.name], ['Type', proj.type], ['Location', proj.location],
            ['Area', `${(proj.built_up_area || 0).toLocaleString()} sqft`], ['Construction', proj.construction_type]
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 90 }}>{k}:</span>
              <span style={{ fontWeight: 600 }}>{v || '—'}</span>
            </div>
          ))}
        </div>
      </PreviewSection>

      {/* BOQ Summary */}
      {boq.length > 0 && (
        <PreviewSection title={`BOQ Summary (${boq.length} items)`}>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['#', 'Description', 'Unit', 'Qty', 'Rate', 'Amount'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boq.slice(0, 10).map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>{item.sl_no}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-light)' }}>{item.description}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-light)' }}>{item.unit}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-light)' }}>{item.quantity?.toFixed(2)}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-light)' }}>₹{item.rate}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>₹{item.amount?.toLocaleString()}</td>
                  </tr>
                ))}
                {boq.length > 10 && (
                  <tr><td colSpan={6} style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: 12 }}>...and {boq.length - 10} more items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </PreviewSection>
      )}

      {/* Financial Summary */}
      <PreviewSection title="Financial Summary">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Material Cost', cost.material_cost],
            ['Labor + Equipment', (cost.labor_cost || 0) + (cost.equipment_cost || 0)],
            ['GST (18%)', cost.tax],
            ['Quoted Amount', tender.quoted_amount],
          ].map(([k, v]) => v > 0 && (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
              <span>{k}</span><span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>
            </div>
          ))}
          {tender.discount_percent > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: '#f0fdf4', borderRadius: 6, color: '#16a34a' }}>
              <span>Discount ({tender.discount_percent}%)</span>
              <span style={{ fontWeight: 600 }}>-{formatCurrency((tender.quoted_amount || 0) * tender.discount_percent / 100)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--navy)', borderRadius: 8, color: 'white', fontWeight: 700, marginTop: 4 }}>
            <span>FINAL TENDER AMOUNT</span>
            <span style={{ fontSize: 16 }}>{formatCurrency(finalAmt)}</span>
          </div>
        </div>
      </PreviewSection>

      {/* Terms */}
      {tender.payment_terms && (
        <PreviewSection title="Terms & Conditions">
          <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{tender.payment_terms}</p>
        </PreviewSection>
      )}
    </div>
  )
}

function PreviewSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--primary-dark)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        borderBottom: '2px solid var(--primary)', paddingBottom: 4, marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}
