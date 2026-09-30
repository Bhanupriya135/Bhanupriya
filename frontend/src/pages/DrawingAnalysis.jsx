import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { estimationService } from '../services/estimationService'
import { projectService } from '../services/projectService'
import { Upload, FileText, Image, CheckCircle, XCircle, Clock, Zap, Home, Layers, DoorOpen } from 'lucide-react'
import StatusBadge from '../components/common/StatusBadge'
import { PageLoader, LoadingSpinner } from '../components/common/LoadingSpinner'
import { formatFileSize, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'

export default function DrawingAnalysis() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [drawings, setDrawings] = useState([])
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectService.getAll().then(res => {
      setProjects(res.data)
      if (res.data.length > 0) setSelectedProject(String(res.data[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProject) {
      estimationService.getDrawings(selectedProject).then(res => setDrawings(res.data))
    }
  }, [selectedProject])

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedProject) { toast.error('Please select a project first'); return }
    if (!acceptedFiles.length) return

    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData()
        formData.append('project_id', selectedProject)
        formData.append('file', file)
        await estimationService.uploadDrawing(formData)
        toast.success(`${file.name} uploaded successfully`)
      }
      const res = await estimationService.getDrawings(selectedProject)
      setDrawings(res.data)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [selectedProject])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 50 * 1024 * 1024,
  })

  const handleAnalyze = async (drawingId) => {
    setAnalyzing(drawingId)
    try {
      await estimationService.analyzeDrawing(drawingId)
      toast.success('Analysis complete!')
      const res = await estimationService.getDrawings(selectedProject)
      setDrawings(res.data)
    } catch (err) {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(null)
    }
  }

  if (loading) return <PageLoader />

  const selectedDrawing = drawings.find(d => d.analysis_status === 'completed' && d.analysis_result)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Drawing Analysis</h1>
          <p className="page-subtitle">Upload floor plans and drawings for AI-assisted analysis</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="card mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Project</label>
          <select
            className="form-control"
            style={{ maxWidth: 400 }}
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">-- Select Project --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Upload Zone */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Upload Drawing</h2></div>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '40px 20px',
              textAlign: 'center',
              cursor: selectedProject ? 'pointer' : 'not-allowed',
              background: isDragActive ? 'var(--primary-50)' : 'var(--bg-secondary)',
              transition: 'all 0.2s',
              opacity: selectedProject ? 1 : 0.6,
            }}
          >
            <input {...getInputProps()} disabled={!selectedProject} />
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <LoadingSpinner size={36} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Uploading...</span>
              </div>
            ) : (
              <>
                <Upload size={36} color="var(--primary)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {isDragActive ? 'Drop files here' : 'Drag & drop drawings here'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Supports PDF, JPG, PNG (max 50MB)
                </div>
                <button className="btn btn-primary btn-sm" type="button">
                  Browse Files
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {[
              { icon: FileText, label: 'PDF Plans' },
              { icon: Image, label: 'Floor Images' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', background: 'var(--bg-secondary)',
                borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)',
              }}>
                <Icon size={14} /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Result */}
        {selectedDrawing?.analysis_result && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Analysis Results</h2>
              <span className="badge badge-green">Completed</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: Home, label: 'Total Rooms', value: selectedDrawing.analysis_result.elements?.rooms?.total, color: '#0ea5e9' },
                { icon: Layers, label: 'Floors', value: selectedDrawing.analysis_result.dimensions?.floors, color: '#8b5cf6' },
                { icon: DoorOpen, label: 'Doors', value: selectedDrawing.analysis_result.elements?.openings?.doors, color: '#f59e0b' },
                { icon: Zap, label: 'Columns', value: selectedDrawing.analysis_result.elements?.structural?.columns, color: '#22c55e' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ padding: 12, background: color + '12', borderRadius: 8, border: `1px solid ${color}25` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={14} color={color} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color }}>{value || '-'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Built-up Area</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedDrawing.analysis_result.dimensions?.total_built_up_area_sqft?.toLocaleString()} sqft
              </div>
            </div>
            <div style={{ marginTop: 8, padding: '8px 10px', background: '#fef9c3', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
              ⚠ Analysis is AI-simulated for MVP. Integrate real CV/OCR for actual drawing analysis.
            </div>
          </div>
        )}
      </div>

      {/* Drawings List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Uploaded Drawings ({drawings.length})</h2>
        </div>
        {drawings.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} />
            <h3>No drawings uploaded</h3>
            <p>Upload floor plans or drawings to begin analysis</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Upload Status</th>
                  <th>Analysis Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drawings.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {d.file_type === 'pdf' ? <FileText size={16} color="var(--error)" /> : <Image size={16} color="var(--primary)" />}
                        <span style={{ fontWeight: 500 }}>{d.file_name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{d.file_type?.toUpperCase()}</span></td>
                    <td>{formatFileSize(d.file_size)}</td>
                    <td><StatusBadge status={d.upload_status} /></td>
                    <td>
                      {analyzing === d.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <LoadingSpinner size={14} /> <span style={{ fontSize: 12 }}>Analyzing...</span>
                        </div>
                      ) : <StatusBadge status={d.analysis_status} />}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(d.created_at)}</td>
                    <td>
                      {d.analysis_status === 'pending' || d.analysis_status === 'failed' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAnalyze(d.id)}
                          disabled={analyzing === d.id}
                        >
                          <Zap size={12} /> Analyze
                        </button>
                      ) : d.analysis_status === 'completed' ? (
                        <span style={{ color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} /> Done
                        </span>
                      ) : null}
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
