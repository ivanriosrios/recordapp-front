import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://recordapp-production.up.railway.app'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Interceptor: adjunta business_id desde localStorage si existe
api.interceptors.request.use((config) => {
  const businessId = localStorage.getItem('business_id')
  if (businessId) {
    config.headers['X-Business-Id'] = businessId
  }
  return config
})

// Interceptor: manejo de errores centralizado
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Error de conexión'
    return Promise.reject(new Error(message))
  }
)

export default api
