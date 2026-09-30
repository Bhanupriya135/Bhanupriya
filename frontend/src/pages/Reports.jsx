import React, { useState, useEffect } from 'react'
import { reportService } from '../services/reportService'
import { projectService } from '../services/projectService'
import { FileText, Download, Eye, RefreshCw, Printer } from 'lucide-react'
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function Reports() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [viewReport, setViewReport] = useState(null)

  useEffect(() => {
    projectService.getAll().then(res => {
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(String(res.data[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) {
      reportService.getByProject(selectedProject).then(res => setReports(res.data)).catch(() => setReports([]))
    }
  }, [selectedProject])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await reportService.generate(parseInt(selectedProject))
      setReports(prev => [res.data, ...prev])
      toast.success('Report generated successfully!')
      setViewReport(res.data)
    } catch (err) {
      toast.error(err.message || 'Report generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and view comprehensive project reports</p>
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
            {generating ? <><LoadingSpinner size={16} color="white" /> Generating...</> : <><FileText size={16} /> Generate Report</>}
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="card mb-4">
        <div className="card-header"><h2 className="card-title">Generated Reports</h2></div>
        {reports.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} />
            <h3>No reports yet</h3>
            <p>Generate a project report to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Report Title</th>
                  <th>Type</th>
                  <th>Generated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{r.title || 'Project Report'}</td>
                    <td><span className="badge badge-blue">{r.report_type?.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(r.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setViewReport(r)}>
                          <Eye size={13} /> View
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

      {/* Report Viewer Modal */}
      <Modal
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        title={viewReport?.title || 'Project Report'}
        size="xl"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setViewReport(null)}>Close</button>
            <button className="btn btn-primary" onClick={printReport}><Printer size={14} /> Print Report</button>
          </div>
        }
      >
        {viewReport?.report_data && <ReportView data={viewReport.report_data} />}
      </Modal>
    </div>
  )
}

function ReportView({ data }) {
  if (!data) return null
  const { project, material_estimation, cost_estimation, boq, drawing_analysis, summary } = data

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy), var(--primary-dark))',
        color: 'white', padding: '20px 24px', borderRadius: 10, marginBottom: 20,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{project?.name}</div>
        <div style={{ opacity: 0.8 }}>Client: {project?.client} | {project?.type} | {project?.location}</div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Generated: {data.generated_at?.replace('T', ' ').slice(0, 19)}</div>
      </div>

      {/* Project Details */}
      <Section title="Project Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Project Type', project?.type],
            ['Construction Type', project?.construction_type],
            ['Location', project?.location],
            ['Built-up Area', `${project?.built_up_area?.toLocaleString() || 0} sqft`],
            ['Floors', project?.floors],
            ['Status', project?.status?.replace('_', ' ')],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>{k}:</span>
              <span style={{ fontWeight: 600 }}>{v || '-'}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Drawing Analysis */}
      {drawing_analysis?.elements && (
        <Section title="Drawing Analysis Summary">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              ['Total Rooms', drawing_analysis.elements.rooms?.total],
              ['Columns', drawing_analysis.elements.structural?.columns],
              ['Beams', drawing_analysis.elements.structural?.beams],
              ['Doors', drawing_analysis.elements.openings?.doors],
            ].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center', padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{v || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Material Estimation */}
      {material_estimation?.items?.length > 0 && (
        <Section title="Material Estimation">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Material', 'Category', 'Quantity', 'Unit', 'Rate', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {material_estimation.items.map((item, i) => (
                <tr key={i}>
                  {[item.material, item.category, item.quantity?.toFixed(2), item.unit, `₹${item.rate}`, formatCurrency(item.total)].map((val, j) => (
                    <td key={j} style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-light)' }}>{val}</td>
                  ))}
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: 'var(--bg-secondary)' }}>
                <td colSpan={5} style={{ padding: '8px 10px' }}>Total Material Cost</td>
                <td style={{ padding: '8px 10px' }}>{formatCurrency(material_estimation.total_material_cost)}</td>
              </tr>
            </tbody>
          </table>
        </Section>
      )}

      {/* Cost Summary */}
      {cost_estimation?.total_project_cost > 0 && (
        <Section title="Cost Estimation Summary">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Material Cost', cost_estimation.material_cost],
              ['Labor Cost', cost_estimation.labor_cost],
              ['Equipment Cost', cost_estimation.equipment_cost],
              ['Other Expenses', cost_estimation.other_cost],
              ['GST (18%)', cost_estimation.tax],
              ['Contingency (5%)', cost_estimation.contingency],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <span>{k}</span><span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>
              </div>
            ))}
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--navy)', color: 'white', borderRadius: 8, fontWeight: 700 }}>
              <span>TOTAL PROJECT COST</span><span style={{ fontSize: 16 }}>{formatCurrency(cost_estimation.total_project_cost)}</span>
            </div>
          </div>
        </Section>
      )}

      {/* BOQ Summary */}
      {boq?.items?.length > 0 && (
        <Section title={`BOQ Summary (${boq.total_items} items)`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--primary-100)', borderRadius: 8, fontWeight: 700 }}>
            <span>Total BOQ Value</span><span style={{ fontSize: 15 }}>{formatCurrency(boq.total_amount)}</span>
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)',
        borderBottom: '2px solid var(--primary)', paddingBottom: 6, marginBottom: 12,
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}
