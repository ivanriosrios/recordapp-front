import api from './client'

export const templatesApi = {
  list: (businessId) => api.get(`/businesses/${businessId}/templates/`),
  get: (businessId, templateId) => api.get(`/businesses/${businessId}/templates/${templateId}`),
}
