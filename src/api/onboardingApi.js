import api from './client'

export const onboardingApi = {
  sendTestMessage: (businessId, body) =>
    api.post(`/businesses/${businessId}/onboarding/test-message`, body || {}),
}
