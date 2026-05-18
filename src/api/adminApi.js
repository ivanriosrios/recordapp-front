import api from './client'

export const adminApi = {
  me:          () => api.get('/admin/me/permissions'),
  list:        () => api.get('/admin/businesses-with-subscription'),
  grantFree:   (businessId, months = 1) =>
    api.post(`/admin/businesses/${businessId}/grant-free`, { months }),
  reactivate:  (businessId) =>
    api.post(`/admin/businesses/${businessId}/reactivate-sub`),
  suspend:     (businessId) =>
    api.post(`/admin/businesses/${businessId}/suspend`),
}
