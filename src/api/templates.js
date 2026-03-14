import api from './client'

export const templatesApi = {
  list: (businessId) => api.get(`/businesses/${businessId}/templates/`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/templates/`, data),
  update: (businessId, templateId, data) => api.patch(`/businesses/${businessId}/templates/${templateId}`, data),
}
