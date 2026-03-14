import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://recordappback-production.up.railway.app'
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '').replace(/\/api$/, '')

const api = axios.create({
  baseURL: `${normalizedBaseUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Interceptor: adjunta Bearer token si existe
api.interceptors.request.use((config) => {
  const store = JSON.parse(localStorage.getItem('recordapp-store') || '{}')
  const token = store?.state?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: manejo de errores + redirect a login si 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar store y redirigir a login
      localStorage.removeItem('recordapp-store')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    const message = error.response?.data?.detail || error.message || 'Error de conexión'
    const err = new Error(message)
    err.status = error.response?.status
    err.data = error.response?.data
    return Promise.reject(err)
  }
)

export default api
