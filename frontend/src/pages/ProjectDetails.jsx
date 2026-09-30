import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Building2, MapPin, Layers, Calendar, User } from 'lucide-react'
import { projectService } from '../services/projectService'
import StatusBadge from '../components/common/StatusBadge'
import { PageLoader } from '../components/common/LoadingSpinner'
import { formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectService.getById(id)
      .then(res => setProject(res.data))
      .catch(() => toast.error('Project not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>

  const steps = [
    { label: 'Project Created', done: true },
    { label: 'Drawing Uploaded', done: ['in_progress', 'estimation_done', 'completed'].includes(project.status) },
    { label: 'Drawing Analyzed', done: ['estimation_done', 'completed'].includes(project.status) },
    { label: 'Estimation Done', done: ['estimation_done', 'completed'].includes(project.status) },
    { label: 'BOQ Generated', done: project.status === 'completed' },
    { label: 'Report Generated', done: project.status === 'completed' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.client_name}</p>
        </div>
        <StatusBadge status={project.status} />
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
          <Edit2 size={14} /> Edit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          {/* Project Info */}
          <div className="card mb-4">
            <div className="card-header"><h2 className="card-title">Project Information</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Project Type', value: project.project_type },
                { label: 'Construction Type', value: project.construction_type || '-' },
                { label: 'Location', value: project.location || '-' },
                { label: 'Built-up Area', value: project.built_up_area ? `${project.built_up_area.toLocaleString()} sqft` : '-' },
                { label: 'Number of Floors', value: project.floors || 1 },
                { label: 'Created Date', value: formatDate(project.created_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            {project.description && (
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Description</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>{project.description}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Project Actions</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Upload Drawing', path: '/drawings', color: '#8b5cf6' },
                { label: 'Run Estimation', path: '/estimation', color: '#f59e0b' },
                { label: 'Generate BOQ', path: '/boq', color: '#22c55e' },
                { label: 'Cost Analysis', path: '/cost', color: '#0ea5e9' },
                { label: 'Reports', path: '/reports', color: '#ef4444' },
                { label: 'View Materials', path: '/materials', color: '#64748b' },
              ].map(({ label, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path, { state: { projectId: project.id } })}
                  style={{
                    padding: '12px 8px', background: color + '12', border: `1px solid ${color}30`,
                    borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, color,
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = color + '25' }}
                  onMouseLeave={e => { e.currentTarget.style.background = color + '12' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Workflow Progress</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', gap: 12, paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: step.done ? 'var(--success)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 12, fontWeight: 700,
                  }}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 20,
                      background: step.done ? 'var(--success)' : 'var(--border)',
                      margin: '4px 0',
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{
                    fontSize: 13, fontWeight: step.done ? 600 : 400,
                    color: step.done ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                    {step.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
