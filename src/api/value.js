import api from './client'

export const valueApi = {
  dashboard: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/value/`, { params }),
}
