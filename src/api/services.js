import api from './client'

export const servicesApi = {
  list: (businessId) => api.get(`/businesses/${businessId}/services/`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/services/`, data),
  update: (businessId, serviceId, data) => api.patch(`/businesses/${businessId}/services/${serviceId}`, data),
}
