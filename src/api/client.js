import axios from 'axios'

// Usa el backend como base por defecto (si la env no está definida)
const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://recordappback-production.up.railway.app'
// Normaliza para evitar doble /api/v1 si la env ya lo trae
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '').replace(/\/api$/, '')

const api = axios.create({
  baseURL: `${normalizedBaseUrl}/api/v1`,
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
