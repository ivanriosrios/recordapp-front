import api from './client'

export const notificationsApi = {
  list: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/notifications/`, { params }),

  unreadCount: (businessId) =>
    api.get(`/businesses/${businessId}/notifications/unread_count`),

  markRead: (businessId, notificationId) =>
    api.patch(`/businesses/${businessId}/notifications/${notificationId}/read`),

  markAllRead: (businessId) =>
    api.post(`/businesses/${businessId}/notifications/read_all`),
}
