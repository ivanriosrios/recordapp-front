import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { setAuth } = useAppStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.login({ email: email.trim(), password })
      setAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-text mb-2">Iniciar sesión</h1>
        <p className="text-text-muted text-sm">Ingresa a tu cuenta de RecordApp</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          label="Correo electrónico"
          placeholder="tunegocio@email.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />

        <Input
          label="Contraseña"
          placeholder="Tu contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 text-danger text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!email.trim() || !password.trim() || loading}
          className="mt-2"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>

      <p className="text-center text-text-muted text-sm mt-6">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-primary font-medium">
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
