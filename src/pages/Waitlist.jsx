/**
 * Lista de espera — cuando una cita se libera, el bot ofrece el cupo
 * automáticamente al primero de la cola que coincida con servicio y
 * preferencias.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { waitlistApi, clientsApi, servicesApi } from '../api'
import { useAppStore } from '../store/useAppStore'

const STATUS_LABEL = {
  pending:  { label: 'En espera',  color: '#6366f1', emoji: '⏳' },
  offered:  { label: 'Cupo ofrecido', color: '#f59e0b', emoji: '📩' },
  accepted: { label: 'Aceptado',   color: '#10b981', emoji: '✅' },
  declined: { label: 'Rechazó',    color: '#ef4444', emoji: '❌' },
  expired:  { label: 'Expiró',     color: '#94a3b8', emoji: '⏱️' },
  removed:  { label: 'Eliminado',  color: '#64748b', emoji: '🗑️' },
}

const SHIFTS = [
  { value: '',          label: 'Cualquiera' },
  { value: 'morning',   label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening',   label: 'Noche' },
]

function fmtDate(d) {
  if (!d) return 'Cualquier fecha'
  return new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

export default function WaitlistPage() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const qc = useQueryClient()
  const businessId = business?.id

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ client_id: '', service_id: '', preferred_date: '', preferred_shift: '' })

  const entriesQ = useQuery({
    queryKey: ['waitlist', businessId],
    queryFn: () => waitlistApi.list(businessId),
    enabled: !!businessId,
  })
  const clientsQ = useQuery({
    queryKey: ['clients', businessId],
    queryFn: () => clientsApi.list(businessId),
    enabled: !!businessId,
  })
  const servicesQ = useQuery({
    queryKey: ['services', businessId],
    queryFn: () => servicesApi.list(businessId),
    enabled: !!businessId,
  })

  const addMut = useMutation({
    mutationFn: (payload) => waitlistApi.add(businessId, payload),
    onSuccess: () => {
      setAdding(false)
      setForm({ client_id: '', service_id: '', preferred_date: '', preferred_shift: '' })
      qc.invalidateQueries({ queryKey: ['waitlist', businessId] })
    },
  })
  const removeMut = useMutation({
    mutationFn: (entryId) => waitlistApi.remove(businessId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist', businessId] }),
  })

  const entries = entriesQ.data || []

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <button onClick={() => navigate(-1)} style={{
        color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12,
      }}>← Volver</button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            📋 Lista de espera
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginTop: 2 }}>
            Cuando se libere un cupo, ofrecemos automáticamente al primero de la lista.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          + Agregar
        </button>
      </div>

      {adding && (
        <div style={{
          background: '#1e2235', border: '1px solid #2d3148',
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}>
          <Select label="Cliente" value={form.client_id}
                  onChange={(v) => setForm({ ...form, client_id: v })}
                  options={[{ value: '', label: 'Selecciona…' }, ...(clientsQ.data || []).map((c) => ({ value: c.id, label: c.display_name }))]} />
          <Select label="Servicio" value={form.service_id}
                  onChange={(v) => setForm({ ...form, service_id: v })}
                  options={[{ value: '', label: 'Selecciona…' }, ...(servicesQ.data || []).map((s) => ({ value: s.id, label: s.name }))]} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Fecha preferida (opcional)" type="date" value={form.preferred_date}
                   onChange={(v) => setForm({ ...form, preferred_date: v })} />
            <Select label="Turno preferido" value={form.preferred_shift}
                    onChange={(v) => setForm({ ...form, preferred_shift: v })}
                    options={SHIFTS} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              disabled={!form.client_id || !form.service_id || addMut.isPending}
              onClick={() => addMut.mutate({
                client_id: form.client_id,
                service_id: form.service_id,
                preferred_date: form.preferred_date || null,
                preferred_shift: form.preferred_shift || null,
              })}
              style={primaryBtn(!form.client_id || !form.service_id)}
            >
              {addMut.isPending ? 'Guardando…' : 'Agregar a la lista'}
            </button>
            <button onClick={() => setAdding(false)} style={secondaryBtn()}>Cancelar</button>
          </div>
        </div>
      )}

      {entriesQ.isLoading && <p style={{ color: '#94a3b8' }}>Cargando…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e) => {
          const meta = STATUS_LABEL[e.status] || { label: e.status, color: '#64748b', emoji: '•' }
          return (
            <div key={e.id} style={{
              background: '#1e2235', borderRadius: 14, padding: 12,
              border: '1px solid #2d3148',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${meta.color}22`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{meta.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                  {e.client_name || 'Cliente'}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  {fmtDate(e.preferred_date)} · {e.preferred_shift ? SHIFTS.find((s) => s.value === e.preferred_shift)?.label : 'cualquier turno'}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: meta.color,
                background: `${meta.color}22`, borderRadius: 999, padding: '3px 10px',
                whiteSpace: 'nowrap',
              }}>
                {meta.label}
              </span>
              {(e.status === 'pending' || e.status === 'offered') && (
                <button
                  onClick={() => {
                    if (confirm('¿Quitar de la lista?')) removeMut.mutate(e.id)
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}
                  title="Quitar"
                >×</button>
              )}
            </div>
          )
        })}
        {!entriesQ.isLoading && entries.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: 30 }}>
            Sin clientes en lista de espera todavía.
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange }) {
  return (
    <label style={{ display: 'block', marginBottom: 8, flex: 1 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{label}</span>
      <input
        type={type} value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          background: '#0f172a', border: '1px solid #2d3148',
          color: '#e2e8f0', fontSize: 13,
        }}
      />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'block', marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{label}</span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          background: '#0f172a', border: '1px solid #2d3148',
          color: '#e2e8f0', fontSize: 13,
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function primaryBtn(disabled) {
  return {
    flex: 1, padding: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', borderRadius: 10, color: '#fff',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
}

function secondaryBtn() {
  return {
    padding: '10px 16px', background: '#0f172a',
    border: '1px solid #2d3148', borderRadius: 10,
    color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  }
}
