import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  FolderKanban, TrendingUp, DollarSign, Package,
  Plus, Upload, Calculator, ClipboardList, FileText,
  Calendar, MapPin, Building2, ArrowRight
} from 'lucide-react'
import { projectService } from '../services/projectService'
import { PageLoader } from '../components/common/LoadingSpinner'
import StatusBadge from '../components/common/StatusBadge'
import { formatCurrency, formatDate } from '../utils/formatters'

const PIE_COLORS = ['#0ea5e9', '#0369a1', '#38bdf8', '#7dd3fc', '#f59e0b', '#22c55e']

const monthlyData = [
  { month: 'Oct', projects: 2, cost: 4200000 },
  { month: 'Nov', projects: 3, cost: 6800000 },
  { month: 'Dec', projects: 1, cost: 2100000 },
  { month: 'Jan', projects: 4, cost: 9500000 },
  { month: 'Feb', projects: 2, cost: 5200000 },
  { month: 'Mar', projects: 5, cost: 12000000 },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projRes, statsRes] = await Promise.all([
        projectService.getAll({ limit: 5 }),
        projectService.getStats(),
      ])
      setProjects(projRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader message="Loading dashboard..." />

  const pieData = [
    { name: 'Residential', value: projects.filter(p => p.project_type === 'Residential').length || 2 },
    { name: 'Commercial', value: projects.filter(p => p.project_type === 'Commercial').length || 1 },
    { name: 'Industrial', value: projects.filter(p => p.project_type === 'Industrial').length || 1 },
    { name: 'Infrastructure', value: projects.filter(p => p.project_type === 'Infrastructure').length || 1 },
  ].filter(d => d.value > 0)

  const kpis = [
    {
      label: 'Total Projects',
      value: stats.total_projects || 0,
      icon: FolderKanban,
      color: '#0ea5e9',
      bg: '#f0f9ff',
    },
    {
      label: 'Active Projects',
      value: stats.active_projects || 0,
      icon: TrendingUp,
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      label: 'Estimation Done',
      value: stats.estimation_done || 0,
      icon: Calculator,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      label: 'Completed',
      value: stats.completed_projects || 0,
      icon: Package,
      color: '#22c55e',
      bg: '#f0fdf4',
    },
  ]

  const quickActions = [
    { label: 'New Project', icon: Plus, color: '#0ea5e9', action: () => navigate('/projects') },
    { label: 'Upload Drawing', icon: Upload, color: '#8b5cf6', action: () => navigate('/drawings') },
    { label: 'Start Estimation', icon: Calculator, color: '#f59e0b', action: () => navigate('/estimation') },
    { label: 'Generate BOQ', icon: ClipboardList, color: '#22c55e', action: () => navigate('/boq') },
    { label: 'Generate Report', icon: FileText, color: '#ef4444', action: () => navigate('/reports') },
  ]

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-icon" style={{ background: kpi.bg }}>
              <kpi.icon size={22} color={kpi.color} />
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = action.color + '15'
                e.currentTarget.style.borderColor = action.color
                e.currentTarget.style.color = action.color
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
            >
              <action.icon size={16} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Estimation Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v, n) => n === 'cost' ? [`₹${(v/100000).toFixed(1)}L`, 'Est. Cost'] : [v, 'Projects']} />
              <Bar dataKey="cost" fill="var(--primary)" radius={[4,4,0,0]} name="cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Type Pie */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Project Types</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Projects</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={40} />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/projects')}>
              <Plus size={16} /> Create Project
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Area (sqft)</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.name}</td>
                    <td>{p.client_name}</td>
                    <td><span className="badge badge-blue">{p.project_type}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 13 }}>{p.location || '-'}</span>
                      </div>
                    </td>
                    <td>{p.built_up_area ? p.built_up_area.toLocaleString() : '-'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(p.updated_at)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
