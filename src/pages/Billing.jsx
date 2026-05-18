import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '../api'
import { useAppStore } from '../store/useAppStore'

const STATUS_META = {
  trialing: { label: 'En prueba', color: '#3b82f6', emoji: '🎁' },
  active:   { label: 'Activa',    color: '#10b981', emoji: '✅' },
  past_due: { label: 'Pago pendiente', color: '#f59e0b', emoji: '⚠️' },
  canceled: { label: 'Cancelada', color: '#ef4444', emoji: '⛔' },
  free:     { label: 'Cortesía',  color: '#8b5cf6', emoji: '🎉' },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BillingPage() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const qc = useQueryClient()
  const [email, setEmail] = useState(business?.email || '')

  const pricingQ = useQuery({
    queryKey: ['billing-pricing'],
    queryFn: () => billingApi.pricing(),
  })
  const meQ = useQuery({
    queryKey: ['billing-me'],
    queryFn: () => billingApi.me(),
    enabled: !!business?.id,
  })

  const checkoutMut = useMutation({
    mutationFn: (e) => billingApi.checkout(e),
    onSuccess: (data) => {
      if (data?.mp_init_point) window.location.href = data.mp_init_point
      qc.invalidateQueries({ queryKey: ['billing-me'] })
    },
  })

  const cancelMut = useMutation({
    mutationFn: () => billingApi.cancel(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-me'] }),
  })

  const sub = meQ.data
  const pricing = pricingQ.data
  const meta = sub ? STATUS_META[sub.status] || { label: sub.status, color: '#64748b', emoji: '•' } : null

  return (
    <div style={{ padding: '20px 20px 100px', maxWidth: 520, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}
      >
        ← Volver
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: 0, marginBottom: 4 }}>
        💳 Suscripción
      </h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, marginBottom: 18 }}>
        Tu plan de RecordApp y métodos de pago.
      </p>

      {/* ── Plan actual ── */}
      {sub && (
        <div style={{
          background: '#1e2235', borderRadius: 16, padding: 16,
          border: '1px solid #2d3148', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Estado</span>
            <span style={{
              fontSize: 12, fontWeight: 800, color: meta.color,
              background: `${meta.color}22`, borderRadius: 999, padding: '3px 10px',
            }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: 0, marginBottom: 4 }}>
            {sub.plan_name} — ${sub.price_usd} {sub.currency}/mes
          </p>
          {sub.trial_ends_at && sub.status === 'trialing' && (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Prueba gratis hasta el <b>{fmtDate(sub.trial_ends_at)}</b>
            </p>
          )}
          {sub.current_period_end && sub.status !== 'trialing' && (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              {sub.status === 'free' ? 'Cortesía vigente hasta' : 'Próximo cobro'}: <b>{fmtDate(sub.current_period_end)}</b>
            </p>
          )}
          {sub.granted_free_months > 0 && (
            <p style={{ fontSize: 12, color: '#a78bfa', margin: 0, marginTop: 4 }}>
              🎁 {sub.granted_free_months} mes(es) de cortesía otorgados
            </p>
          )}
        </div>
      )}

      {/* ── Activar suscripción / agregar tarjeta ── */}
      {sub && !sub.mp_preapproval_id && (
        <div style={{
          background: '#1e2235', borderRadius: 16, padding: 16,
          border: '1px solid #2d3148', marginBottom: 16,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0, marginBottom: 6 }}>
            Activa con MercadoPago
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginBottom: 12 }}>
            Te cobramos ${pricing?.price_usd ?? sub.price_usd} {sub.currency}/mes tras los {pricing?.trial_days ?? 14} días de prueba.
            Puedes cancelar en cualquier momento.
          </p>
          <input
            type="email"
            placeholder="email de MercadoPago"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              background: '#0f172a', border: '1px solid #2d3148', color: '#e2e8f0',
              marginBottom: 10, fontSize: 13,
            }}
          />
          <button
            disabled={!email || checkoutMut.isPending}
            onClick={() => checkoutMut.mutate(email)}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              opacity: !email || checkoutMut.isPending ? 0.6 : 1,
            }}
          >
            {checkoutMut.isPending ? 'Generando link…' : 'Pagar con MercadoPago'}
          </button>
          {checkoutMut.isError && (
            <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 8 }}>
              No se pudo crear el cobro. {checkoutMut.error?.message}
            </p>
          )}
        </div>
      )}

      {/* ── Cancelar ── */}
      {sub && sub.status !== 'canceled' && sub.mp_preapproval_id && (
        <button
          onClick={() => {
            if (confirm('¿Cancelar suscripción? Mantienes acceso hasta el final del período.')) {
              cancelMut.mutate()
            }
          }}
          style={{
            width: '100%', padding: '10px',
            background: 'transparent', border: '1px solid #ef4444',
            color: '#ef4444', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Cancelar suscripción
        </button>
      )}
    </div>
  )
}
