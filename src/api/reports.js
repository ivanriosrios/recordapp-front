import api from './client'

export const reportsApi = {
  income: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/reports/income`, { params }),

  timeline: (businessId, params = {}) =>
    api.get(`/businesses/${businessId}/reports/income/timeline`, { params }),

  exportCsvUrl: (businessId, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return `/businesses/${businessId}/reports/income/export${qs ? '?' + qs : ''}`
  },
}
