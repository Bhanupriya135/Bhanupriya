import api from './api'

export const tenderService = {
  getByProject:  (projectId) => api.get(`/tenders/project/${projectId}`),
  getById:       (id)        => api.get(`/tenders/${id}`),
  create:        (data)      => api.post('/tenders', data),
  update:        (id, data)  => api.put(`/tenders/${id}`, data),
  delete:        (id)        => api.delete(`/tenders/${id}`),
  refresh:       (id)        => api.post(`/tenders/${id}/refresh`),
  downloadPdf:   (id)        => `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tenders/${id}/pdf`,

  // Export helpers (features 1 & 3)
  downloadReportPdf: (projectId) => `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/export/report/${projectId}/pdf`,
  downloadBoqPdf:    (projectId) => `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/export/boq/${projectId}/pdf`,
  exportMaterials:   (category)  => `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/materials/export/excel${category ? `?category=${category}` : ''}`,
  importTemplate:    ()          => `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/materials/import/template`,
  importExcel:       (formData)  => api.post('/materials/import/excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Revision history
  getRevisions:  (projectId) => api.get(`/revisions/project/${projectId}`),
}
