import React, { useState, useEffect } from 'react'
import { estimationService } from '../services/estimationService'
import { projectService } from '../services/projectService'
import { Calculator, RefreshCw, Edit2, Trash2, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatCurrency, formatNumber } from '../utils/formatters'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#0ea5e9','#0369a1','#38bdf8','#f59e0b','#22c55e','#8b5cf6','#ef4444','#64748b','#06b6d4','#84cc16']

export default function MaterialEstimation() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [estimations, setEstimations] = useState([])
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({ quantity: '', unit_rate: '' })

  useEffect(() => {
    projectService.getAll().then(res => {
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(String(res.data[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) loadEstimations()
  }, [selectedProject])

  const loadEstimations = async () => {
    try {
      const res = await estimationService.getByProject(selectedProject)
      setEstimations(res.data.estimations || [])
      setTotalCost(res.data.total_material_cost || 0)
    } catch (err) {}
  }

  const handleCalculate = async () => {
    if (!selectedProject) { toast.error('Please select a project'); return }
    const project = projects.find(p => p.id === parseInt(selectedProject))
    if (!project?.built_up_area) {
      toast.error('Project must have built-up area defined. Please edit the project first.')
      return
    }
    setCalculating(true)
    try {
      const res = await estimationService.calculate({
        project_id: parseInt(selectedProject),
        built_up_area: project.built_up_area,
        floors: project.floors,
        construction_type: project.construction_type,
      })
      setEstimations(res.data.estimations || [])
      setTotalCost(res.data.total_material_cost || 0)
      toast.success('Estimation calculated successfully!')
    } catch (err) {
      toast.error(err.message || 'Calculation failed')
    } finally {
      setCalculating(false)
    }
  }

  const handleUpdate = async () => {
    try {
      await estimationService.update(editItem.id, {
        quantity: parseFloat(editForm.quantity),
        unit_rate: parseFloat(editForm.unit_rate),
      })
      toast.success('Updated successfully')
      setEditItem(null)
      loadEstimations()
    } catch (err) {
      toast.error('Update failed')
    }
  }

  if (loading) return <PageLoader />

  const pieData = estimations
    .filter(e => e.total_cost > 0)
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 8)
    .map(e => ({ name: e.material_name, value: e.total_cost }))

  const project = projects.find(p => p.id === parseInt(selectedProject))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Material Estimation</h1>
          <p className="page-subtitle">Calculate material quantities and costs for your project</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
            <label className="form-label">Select Project</label>
            <select className="form-control" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.built_up_area || '?'} sqft)</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating || !selectedProject}>
            {calculating ? <><LoadingSpinner size={16} color="white" /> Calculating...</> : <><Calculator size={16} /> Calculate Estimation</>}
          </button>
          {estimations.length > 0 && (
            <button className="btn btn-secondary" onClick={loadEstimations}>
              <RefreshCw size={16} /> Refresh
            </button>
          )}
        </div>
        {project && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Area', value: `${project.built_up_area?.toLocaleString() || 0} sqft` },
              { label: 'Floors', value: project.floors || 1 },
              { label: 'Type', value: project.construction_type || 'RCC' },
              { label: 'Total Area', value: `${((project.built_up_area || 0) * (project.floors || 1)).toLocaleString()} sqft` },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {estimations.length > 0 && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#f0f9ff' }}><TrendingUp size={20} color="var(--primary)" /></div>
              <div className="kpi-value">{estimations.length}</div>
              <div className="kpi-label">Materials Estimated</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#f0fdf4' }}><Calculator size={20} color="#22c55e" /></div>
              <div className="kpi-value" style={{ fontSize: 22 }}>{formatCurrency(totalCost)}</div>
              <div className="kpi-label">Total Material Cost</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#fffbeb' }}><TrendingUp size={20} color="#f59e0b" /></div>
              <div className="kpi-value" style={{ fontSize: 20 }}>
                {project?.built_up_area ? formatCurrency(totalCost / (project.built_up_area * (project.floors || 1))) : '-'}
              </div>
              <div className="kpi-label">Cost per sqft (Material)</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
            {/* Table */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Material Breakdown</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Material</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Rate (₹)</th>
                      <th>Amount (₹)</th>
                      <th>%</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimations.map((e, i) => (
                      <tr key={e.id}>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{e.material_name}</td>
                        <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{e.material_category}</span></td>
                        <td>{formatNumber(e.quantity)}</td>
                        <td>{e.material_unit}</td>
                        <td>{formatNumber(e.unit_rate, 0)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(e.total_cost)}</td>
                        <td style={{ fontSize: 12 }}>{totalCost > 0 ? ((e.total_cost / totalCost) * 100).toFixed(1) : 0}%</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(e); setEditForm({ quantity: e.quantity, unit_rate: e.unit_rate }) }}>
                            <Edit2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <td colSpan={6} style={{ padding: '10px 14px', fontSize: 14 }}>Total Material Cost</td>
                      <td style={{ padding: '10px 14px', fontSize: 14, color: 'var(--primary-dark)' }}>{formatCurrency(totalCost)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="card">
              <div className="card-header"><h2 className="card-title">Cost Distribution</h2></div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {estimations.length === 0 && selectedProject && (
        <div className="card">
          <div className="empty-state">
            <Calculator size={40} />
            <h3>No estimation yet</h3>
            <p>Click "Calculate Estimation" to generate material quantities for this project</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit: ${editItem?.material_name}`}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate}>Update</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Quantity ({editItem?.material_unit})</label>
          <input type="number" className="form-control" value={editForm.quantity} onChange={e => setEditForm(f => ({...f, quantity: e.target.value}))} step="0.01" />
        </div>
        <div className="form-group">
          <label className="form-label">Unit Rate (₹)</label>
          <input type="number" className="form-control" value={editForm.unit_rate} onChange={e => setEditForm(f => ({...f, unit_rate: e.target.value}))} step="0.01" />
        </div>
        <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13 }}>
          Estimated Total: <strong>{formatCurrency(parseFloat(editForm.quantity || 0) * parseFloat(editForm.unit_rate || 0))}</strong>
        </div>
      </Modal>
    </div>
  )
}
