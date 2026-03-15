import api from './client'

export const analyticsApi = {
  get: (businessId) =>
    api.get(`/businesses/${businessId}/analytics`),
}
