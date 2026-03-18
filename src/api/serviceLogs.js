import api from './client'

export const serviceLogsApi = {
  create: (businessId, data) =>
    api.post(`/businesses/${businessId}/service-logs/`, data),

  list: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/service-logs/`, { params }),

  complete: (businessId, logId, data) =>
    api.post(`/businesses/${businessId}/service-logs/${logId}/complete`, data),
}
