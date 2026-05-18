import api from './client'

export const waitlistApi = {
  list: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/waitlist/`, { params }),

  add: (businessId, { client_id, service_id, preferred_date, preferred_shift }) =>
    api.post(`/businesses/${businessId}/waitlist/`, {
      client_id, service_id, preferred_date, preferred_shift,
    }),

  remove: (businessId, entryId) =>
    api.delete(`/businesses/${businessId}/waitlist/${entryId}`),
}
