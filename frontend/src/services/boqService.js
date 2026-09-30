import api from './api'

export const boqService = {
  generate: (projectId) => api.post('/boq/generate', { project_id: projectId }),
  getByProject: (projectId) => api.get(`/boq/project/${projectId}`),
  addItem: (data) => api.post('/boq/item', data),
  updateItem: (id, data) => api.put(`/boq/${id}`, data),
  deleteItem: (id) => api.delete(`/boq/${id}`),
}
