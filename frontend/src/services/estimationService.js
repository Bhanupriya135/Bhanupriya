import api from './api'

export const estimationService = {
  calculate: (data) => api.post('/estimation/calculate', data),
  getByProject: (projectId) => api.get(`/estimation/project/${projectId}`),
  getCost: (projectId) => api.get(`/estimation/cost/${projectId}`),
  update: (id, data) => api.put(`/estimation/${id}`, data),
  delete: (id) => api.delete(`/estimation/${id}`),

  // Drawings
  uploadDrawing: (formData) => api.post('/drawings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDrawings: (projectId) => api.get(`/drawings/${projectId}`),
  analyzeDrawing: (drawingId) => api.post(`/drawings/${drawingId}/analyze`),
}
