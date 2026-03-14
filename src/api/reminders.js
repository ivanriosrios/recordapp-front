import api from './client'

export const remindersApi = {
  list: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/reminders/`, { params }),

  get: (businessId, reminderId) =>
    api.get(`/businesses/${businessId}/reminders/${reminderId}`),

  create: (businessId, data) =>
    api.post(`/businesses/${businessId}/reminders/`, data),

  update: (businessId, reminderId, data) =>
    api.patch(`/businesses/${businessId}/reminders/${reminderId}`, data),
}
