import api from './client'

export const billingApi = {
  pricing:   () => api.get('/billing/pricing'),
  me:        () => api.get('/billing/me'),
  checkout:  (payer_email) => api.post('/billing/me/checkout', { payer_email }),
  cancel:    () => api.post('/billing/me/cancel'),
}
