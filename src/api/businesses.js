import api from './client'

export const businessesApi = {
  create: (data) => api.post('/businesses/', data),
  get: (id) => api.get(`/businesses/${id}`),
  update: (id, data) => api.patch(`/businesses/${id}`, data),
}
