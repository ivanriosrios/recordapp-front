import api from './client'

export const clientsApi = {
  list: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/clients/`, { params }),

  get: (businessId, clientId) =>
    api.get(`/businesses/${businessId}/clients/${clientId}`),

  create: (businessId, data) =>
    api.post(`/businesses/${businessId}/clients/`, data),

  update: (businessId, clientId, data) =>
    api.patch(`/businesses/${businessId}/clients/${clientId}`, data),

  bulkUpload: (businessId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/businesses/${businessId}/clients/bulk-upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
