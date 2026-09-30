import React, { useState, useEffect } from 'react'
import { estimationService } from '../services/estimationService'
import { projectService } from '../services/projectService'
import { DollarSign, TrendingUp, Package, Wrench, HelpCircle, Receipt } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { PageLoader } from '../components/common/LoadingSpinner'
import { formatCurrency, formatLakhs } from '../utils/formatters'
import toast from 'react-hot-toast'

const COLORS = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444', '#64748b']

export default function CostEstimation() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [costData, setCostData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectService.getAll().then(res => {
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(String(res.data[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) loadCost()
  }, [selectedProject])

  const loadCost = async () => {
    try {
      const res = await estimationService.getCost(selectedProject)
      setCostData(res.data)
    } catch (err) {
      setCostData(null)
    }
  }

  if (loading) return <PageLoader />

  const costItems = costData ? [
    { label: 'Material Cost', value: costData.material_cost, icon: Package, color: '#0ea5e9' },
    { label: 'Labor Cost', value: costData.labor_cost, icon: Wrench, color: '#f59e0b' },
    { label: 'Equipment Cost', value: costData.equipment_cost, icon: TrendingUp, color: '#8b5cf6' },
    { label: 'Other Expenses', value: costData.other_cost, icon: HelpCircle, color: '#22c55e' },
    { label: 'GST (18%)', value: costData.tax, icon: Receipt, color: '#ef4444' },
    { label: 'Contingency (5%)', value: costData.contingency, icon: DollarSign, color: '#64748b' },
  ] : []

  const pieData = costItems.filter(c => c.value > 0).map(c => ({ name: c.label, value: c.value }))
  const barData = costItems.slice(0, 4).filter(c => c.value > 0).map(c => ({ name: c.label.replace(' Cost', ''), value: c.value }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cost Estimation</h1>
          <p className="page-subtitle">Complete project cost breakdown including labor, equipment, and taxes</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Project</label>
          <select className="form-control" style={{ maxWidth: 400 }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">-- Select Project --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {!costData || costData.total_project_cost === 0 ? (
        <div className="card">
          <div className="empty-state">
            <DollarSign size={40} />
            <h3>No cost data available</h3>
            <p>Run Material Estimation first to see cost breakdown</p>
          </div>
        </div>
      ) : (
        <>
          {/* Total Cost Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy) 0%, var(--primary-dark) 100%)',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
          }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Total Project Cost</div>
              <div style={{ fontSize: 38, fontWeight: 800 }}>{formatLakhs(costData.total_project_cost)}</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>{formatCurrency(costData.total_project_cost)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Cost per sqft</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>₹{costData.cost_per_sqft?.toLocaleString()}</div>
            </div>
          </div>

          {/* Cost Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {costItems.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(value)}</div>
                {costData.breakdown_percentages && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {costData.breakdown_percentages[label.toLowerCase().split(' ')[0]]}% of total
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h2 className="card-title">Cost Distribution</h2></div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [formatCurrency(v), '']} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="card-title">Cost Comparison</h2></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip formatter={v => [formatCurrency(v), 'Cost']} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
