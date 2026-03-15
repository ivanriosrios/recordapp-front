import api from './client'

export const clientHistoryApi = {
  getHistory: (businessId, clientId) =>
    api.get(`/businesses/${businessId}/clients/${clientId}/history`),
}
