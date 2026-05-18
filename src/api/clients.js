import api from './client'

export const clientsApi = {
  // Devuelve la lista (compat con código existente que asume Array).
  // El backend ahora pagina, así que pedimos un limit alto por default.
  list: async (businessId, params = {}) => {
    const page = await api.get(`/businesses/${businessId}/clients/`, {
      params: { limit: 200, ...params },
    })
    return Array.isArray(page) ? page : page.items || []
  },

  // Página con metadatos para listados grandes ({items, total, skip, limit}).
  page: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/clients/`, { params }),

  // Clientes inactivos por más de `days` días basado en ServiceLog.
  atRisk: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/clients/at-risk`, { params }),

  get: (businessId, clientId) =>
    api.get(`/businesses/${businessId}/clients/${clientId}`),

  create: (businessId, data) =>
    api.post(`/businesses/${businessId}/clients/`, data),

  update: (businessId, clientId, data) =>
    api.patch(`/businesses/${businessId}/clients/${clientId}`, data),

  remove: (businessId, clientId) =>
    api.delete(`/businesses/${businessId}/clients/${clientId}`),

  bulkUpload: (businessId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/businesses/${businessId}/clients/bulk-upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
