import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

// Tipos de negocio con emoji
const BUSINESS_TYPES = [
  { value: 'taller',      label: 'Taller',      emoji: '🔧' },
  { value: 'odontologia', label: 'Odontología',  emoji: '🦷' },
  { value: 'serviteca',   label: 'Serviteca',    emoji: '🚗' },
  { value: 'contaduria',  label: 'Contaduría',   emoji: '📊' },
  { value: 'peluqueria',  label: 'Peluquería',   emoji: '✂️' },
  { value: 'veterinaria', label: 'Veterinaria',  emoji: '🐾' },
  { value: 'gym',         label: 'Gym',          emoji: '💪' },
  { value: 'otro',        label: 'Otro',         emoji: '🏢' },
]

// Indicador de progreso
function StepIndicator({ current, total }) {
  return (
    <div className="flex gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < current ? 'bg-primary w-6' : i === current ? 'bg-primary w-6' : 'bg-border w-3'
          }`}
        />
      ))}
    </div>
  )
}

// Paso 1: Nombre del negocio
function Step1({ value, onChange, onNext }) {
  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-text mb-2">Bienvenido a RecordApp</h1>
        <p className="text-text-muted text-sm">Automatiza tus recordatorios por WhatsApp</p>
      </div>

      <Input
        label="¿Cómo se llama tu negocio?"
        placeholder="Taller Don Pedro"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />

      <Button
        onClick={onNext}
        disabled={!value.trim()}
        className="mt-2"
      >
        Continuar →
      </Button>
    </div>
  )
}

// Paso 2: Tipo de negocio
function Step2({ value, onChange, onNext, onBack }) {
  return (
    <div className="fade-in">
      <h2 className="text-xl font-bold text-text mb-2">¿Qué tipo de negocio es?</h2>
      <p className="text-text-muted text-sm mb-6">Personalizamos los recordatorios según tu sector</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`p-4 rounded-2xl border text-left transition-all duration-150 ${
              value === type.value
                ? 'border-primary bg-primary/10 text-text'
                : 'border-border bg-card text-text-muted active:bg-surface'
            }`}
          >
            <div className="text-2xl mb-1">{type.emoji}</div>
            <div className="text-sm font-medium">{type.label}</div>
          </button>
        ))}
      </div>

      <Button onClick={onNext} disabled={!value}>Continuar →</Button>
      <button onClick={onBack} className="w-full text-center text-text-muted text-sm mt-3 py-2">
        ← Atrás
      </button>
    </div>
  )
}

// Paso 3: WhatsApp + email + contraseña
function Step3({ form, onChange, onSubmit, onBack, loading, error }) {
  return (
    <div className="fade-in">
      <h2 className="text-xl font-bold text-text mb-2">Datos de contacto</h2>
      <p className="text-text-muted text-sm mb-6">Con esto creamos tu cuenta</p>

      <Input
        label="Número de WhatsApp"
        placeholder="+57 300 123 4567"
        type="tel"
        value={form.whatsapp_phone}
        onChange={(e) => onChange('whatsapp_phone', e.target.value)}
      />

      <Input
        label="Correo electrónico"
        placeholder="tunegocio@email.com"
        type="email"
        value={form.email}
        onChange={(e) => onChange('email', e.target.value)}
      />

      <Input
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        type="password"
        value={form.password}
        onChange={(e) => onChange('password', e.target.value)}
      />

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 text-danger text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={onSubmit}
        disabled={!form.whatsapp_phone.trim() || !form.email.trim() || !form.password.trim() || loading}
        className="mt-2"
      >
        {loading ? 'Creando cuenta...' : '¡Empezar gratis!'}
      </Button>
      <button onClick={onBack} className="w-full text-center text-text-muted text-sm mt-3 py-2">
        ← Atrás
      </button>
    </div>
  )
}

// ─── Componente principal ───────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [form, setForm] = useState({ whatsapp_phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { setAuth } = useAppStore()

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.register({
        name: name.trim(),
        business_type: businessType,
        whatsapp_phone: form.whatsapp_phone.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10">
      <StepIndicator current={step} total={3} />

      {step === 0 && (
        <Step1
          value={name}
          onChange={setName}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <Step2
          value={businessType}
          onChange={setBusinessType}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <Step3
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
          loading={loading}
          error={error}
        />
      )}

      <p className="text-center text-text-muted text-sm mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary font-medium">
          Inicia sesión
        </Link>
      </p>

      <p className="text-center text-text-subtle text-xs mt-4">
        Al registrarte aceptas nuestros términos de uso y política de privacidad
      </p>
    </div>
  )
}
