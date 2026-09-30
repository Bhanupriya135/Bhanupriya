import api from './api'

export const reportService = {
  generate: (projectId, reportType = 'project_report') =>
    api.post('/reports/generate', { project_id: projectId, report_type: reportType }),
  getByProject: (projectId) => api.get(`/reports/project/${projectId}`),
  getById: (id) => api.get(`/reports/${id}`),
}

export const materialService = {
  getAll: (params = {}) => api.get('/materials', { params }),
  getCategories: () => api.get('/materials/categories'),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
}

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
}
