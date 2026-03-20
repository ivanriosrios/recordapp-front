import api from './client'

export const appointmentsApi = {
  list: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/appointments/`, { params }),

  get: (businessId, appointmentId) =>
    api.get(`/businesses/${businessId}/appointments/${appointmentId}`),

  create: (businessId, data) =>
    api.post(`/businesses/${businessId}/appointments/`, data),

  confirm: (businessId, appointmentId) =>
    api.post(`/businesses/${businessId}/appointments/${appointmentId}/confirm`),

  reject: (businessId, appointmentId) =>
    api.post(`/businesses/${businessId}/appointments/${appointmentId}/reject`),

  complete: (businessId, appointmentId, data = {}) =>
    api.post(`/businesses/${businessId}/appointments/${appointmentId}/complete`, data),

  cancel: (businessId, appointmentId) =>
    api.post(`/businesses/${businessId}/appointments/${appointmentId}/cancel`),

  update: (businessId, appointmentId, data, notify = true) =>
    api.patch(`/businesses/${businessId}/appointments/${appointmentId}`, data, { params: { notify } }),
}

export const scheduleApi = {
  get: (businessId) =>
    api.get(`/businesses/${businessId}/schedule/`),

  upsert: (businessId, data) =>
    api.put(`/businesses/${businessId}/schedule/`, data),

  patch: (businessId, data) =>
    api.patch(`/businesses/${businessId}/schedule/`, data),

  delete: (businessId) =>
    api.delete(`/businesses/${businessId}/schedule/`),
}
