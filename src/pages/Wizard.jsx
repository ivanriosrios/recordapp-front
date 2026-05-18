/**
 * Wizard de onboarding post-signup en 4 pasos.
 *
 *  1) Servicio (nombre + precio + duración)
 *  2) Cliente (nombre + teléfono)
 *  3) Mensaje de prueba (envía un WA real al cliente)
 *  4) ¡Listo! → Dashboard
 *
 * Una vez completado, se persiste un flag en localStorage para no
 * volver a mostrarlo en este dispositivo.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicesApi, clientsApi, onboardingApi } from '../api'
import { useAppStore } from '../store/useAppStore'

const STEPS = [
  { key: 'service',  label: 'Servicio' },
  { key: 'client',   label: 'Cliente' },
  { key: 'test',     label: 'Mensaje' },
  { key: 'done',     label: 'Listo' },
]

export default function WizardPage() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Estado del wizard
  const [service, setService] = useState({ name: '', ref_price: '', duration_minutes: '30' })
  const [client, setClient] = useState({ display_name: '', phone: '' })
  const [savedClient, setSavedClient] = useState(null)
  const [testResult, setTestResult] = useState(null)

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))

  async function saveService() {
    setBusy(true); setError('')
    try {
      await servicesApi.create(business.id, {
        name: service.name.trim(),
        ref_price: parseFloat(service.ref_price || '0') || 0,
        estimated_duration_minutes: parseInt(service.duration_minutes || '30', 10),
        is_active: true,
      })
      next()
    } catch (e) {
      setError(e.message || 'No se pudo guardar el servicio')
    } finally {
      setBusy(false)
    }
  }

  async function saveClient() {
    setBusy(true); setError('')
    try {
      const c = await clientsApi.create(business.id, {
        display_name: client.display_name.trim(),
        phone: client.phone.trim(),
        preferred_channel: 'whatsapp',
      })
      setSavedClient(c)
      next()
    } catch (e) {
      setError(e.message || 'No se pudo guardar el cliente')
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setBusy(true); setError('')
    try {
      const result = await onboardingApi.sendTestMessage(business.id, {
        client_id: savedClient?.id,
      })
      setTestResult(result)
      next()
    } catch (e) {
      setError(e.message || 'No se pudo enviar el mensaje. Revisa tu WhatsApp Business.')
    } finally {
      setBusy(false)
    }
  }

  function finish() {
    try { localStorage.setItem(`wizard_completed_${business?.id}`, '1') } catch {}
    navigate('/dashboard')
  }

  function skip() {
    try { localStorage.setItem(`wizard_completed_${business?.id}`, '1') } catch {}
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px 18px 100px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
          Paso {step + 1} de {STEPS.length}
        </p>
        <button onClick={skip} style={{
          background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer',
        }}>Saltar</button>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 26 }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i <= step ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#2d3148',
          }} />
        ))}
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 14,
        }}>{error}</div>
      )}

      {step === 0 && (
        <StepCard
          emoji="✂️"
          title="Agrega tu primer servicio"
          subtitle="Por ejemplo: Corte de cabello. Esto define qué pueden agendar tus clientes."
        >
          <Field label="Nombre del servicio" value={service.name}
                 onChange={(v) => setService({ ...service, name: v })}
                 placeholder="Corte de cabello" />
          <Field label="Precio (en tu moneda)" value={service.ref_price} type="number"
                 onChange={(v) => setService({ ...service, ref_price: v })}
                 placeholder="30000" />
          <Field label="Duración (minutos)" value={service.duration_minutes} type="number"
                 onChange={(v) => setService({ ...service, duration_minutes: v })}
                 placeholder="30" />
          <PrimaryButton
            disabled={!service.name || busy}
            onClick={saveService}
          >
            {busy ? 'Guardando…' : 'Continuar →'}
          </PrimaryButton>
        </StepCard>
      )}

      {step === 1 && (
        <StepCard
          emoji="👤"
          title="Agrega tu primer cliente"
          subtitle="Puedes empezar con uno de prueba (tu propio número) para probar todo el flujo."
        >
          <Field label="Nombre" value={client.display_name}
                 onChange={(v) => setClient({ ...client, display_name: v })}
                 placeholder="Juan Pérez" />
          <Field label="Teléfono (con código país)" value={client.phone}
                 onChange={(v) => setClient({ ...client, phone: v })}
                 placeholder="+57 300 123 4567" />
          <PrimaryButton
            disabled={!client.display_name || !client.phone || busy}
            onClick={saveClient}
          >
            {busy ? 'Guardando…' : 'Continuar →'}
          </PrimaryButton>
        </StepCard>
      )}

      {step === 2 && (
        <StepCard
          emoji="💬"
          title="Manda el primer mensaje"
          subtitle={
            <>Le enviaremos un WhatsApp a <b>{savedClient?.display_name || 'tu cliente'}</b>{' '}
              ({savedClient?.phone || ''}) para confirmar que todo funciona.</>
          }
        >
          <PrimaryButton disabled={busy} onClick={sendTest}>
            {busy ? 'Enviando…' : 'Enviar mensaje de prueba 🚀'}
          </PrimaryButton>
        </StepCard>
      )}

      {step === 3 && (
        <StepCard emoji="🎉" title="¡Listo!" subtitle="Tu cuenta de RecordApp está activa.">
          {testResult && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              Mensaje enviado a <b>{testResult.sent_to}</b>. Revisa WhatsApp.
            </p>
          )}
          <ul style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, paddingLeft: 18 }}>
            <li>Carga el resto de tus clientes desde Clientes</li>
            <li>Crea recordatorios automáticos</li>
            <li>Revisa el dashboard para ver tu impacto</li>
          </ul>
          <PrimaryButton onClick={finish}>Ir al dashboard →</PrimaryButton>
        </StepCard>
      )}
    </div>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────

function StepCard({ emoji, title, subtitle, children }) {
  return (
    <div style={{
      background: '#1e2235', border: '1px solid #2d3148',
      borderRadius: 18, padding: 22,
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: 0, marginBottom: 4 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, marginBottom: 18 }}>{subtitle}</p>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          background: '#0f172a', border: '1px solid #2d3148',
          color: '#e2e8f0', fontSize: 14,
        }}
      />
    </label>
  )
}

function PrimaryButton({ children, ...rest }) {
  return (
    <button
      {...rest}
      style={{
        width: '100%', padding: '12px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none', borderRadius: 12,
        color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        opacity: rest.disabled ? 0.55 : 1, marginTop: 6,
      }}
    >
      {children}
    </button>
  )
}
