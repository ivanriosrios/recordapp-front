import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api'

const SUB_COLOR = {
  trialing: '#3b82f6',
  active:   '#10b981',
  past_due: '#f59e0b',
  canceled: '#ef4444',
  free:     '#8b5cf6',
  null:     '#64748b',
  undefined: '#64748b',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: '2-digit' })
}

export default function AdminPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const permsQ = useQuery({
    queryKey: ['admin-perms'],
    queryFn: () => adminApi.me(),
    retry: false,
  })
  const listQ = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: () => adminApi.list(),
    enabled: permsQ.isSuccess,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-businesses'] })

  const grantMut    = useMutation({ mutationFn: ({ id, months }) => adminApi.grantFree(id, months), onSuccess: invalidate })
  const reactiveMut = useMutation({ mutationFn: (id) => adminApi.reactivate(id), onSuccess: invalidate })
  const suspendMut  = useMutation({ mutationFn: (id) => adminApi.suspend(id), onSuccess: invalidate })

  if (permsQ.isError) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <h2 style={{ color: '#e2e8f0' }}>Acceso restringido</h2>
        <p style={{ color: '#94a3b8' }}>Solo super-admins pueden ver este panel.</p>
        <button onClick={() => navigate('/dashboard')} style={{
          marginTop: 14, padding: '10px 20px', background: '#1e2235',
          border: '1px solid #2d3148', color: '#e2e8f0', borderRadius: 10, cursor: 'pointer',
        }}>
          Volver al inicio
        </button>
      </div>
    )
  }

  const rows = (listQ.data || []).filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <button onClick={() => navigate(-1)} style={{
        color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12,
      }}>← Volver</button>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: 0, marginBottom: 4 }}>
        🛠️ Panel admin
      </h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, marginBottom: 16 }}>
        Gestiona suscripciones, regala meses o reactiva negocios.
      </p>

      <input
        type="search"
        placeholder="Buscar negocio o email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          background: '#1e2235', border: '1px solid #2d3148', color: '#e2e8f0',
          marginBottom: 14, fontSize: 13,
        }}
      />

      {listQ.isLoading && <p style={{ color: '#94a3b8' }}>Cargando…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((b) => {
          const status = b.subscription_status
          const color = SUB_COLOR[status] || '#64748b'
          const inFlight = (
            grantMut.isPending || reactiveMut.isPending || suspendMut.isPending
          )
          return (
            <div key={b.id} style={{
              background: '#1e2235', borderRadius: 14, padding: 14,
              border: '1px solid #2d3148',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{b.name}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, marginTop: 2 }}>
                    {b.email || 'sin email'} · {b.whatsapp_phone}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color, background: `${color}22`,
                  borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap',
                }}>
                  {status || 'sin sub'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0, marginBottom: 10 }}>
                {b.subscription_status === 'trialing' ? `Trial hasta ${fmtDate(b.trial_ends_at)}` :
                 b.current_period_end ? `Vence ${fmtDate(b.current_period_end)}` : '—'}
                {b.granted_free_months > 0 ? ` · ${b.granted_free_months} cortesía(s)` : ''}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  disabled={inFlight}
                  onClick={() => grantMut.mutate({ id: b.id, months: 1 })}
                  style={btnSecondary('#8b5cf6')}
                >
                  🎁 +1 mes
                </button>
                <button
                  disabled={inFlight}
                  onClick={() => {
                    const m = prompt('¿Cuántos meses?', '3')
                    const n = Math.max(1, parseInt(m || '1', 10))
                    grantMut.mutate({ id: b.id, months: n })
                  }}
                  style={btnSecondary('#8b5cf6')}
                >
                  🎁 N meses…
                </button>
                {status !== 'active' && (
                  <button
                    disabled={inFlight}
                    onClick={() => reactiveMut.mutate(b.id)}
                    style={btnSecondary('#10b981')}
                  >
                    ✅ Reactivar
                  </button>
                )}
                {status !== 'canceled' && (
                  <button
                    disabled={inFlight}
                    onClick={() => {
                      if (confirm(`Suspender ${b.name}?`)) suspendMut.mutate(b.id)
                    }}
                    style={btnSecondary('#ef4444')}
                  >
                    ⛔ Suspender
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {!listQ.isLoading && rows.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center' }}>Sin negocios para esa búsqueda.</p>
        )}
      </div>
    </div>
  )
}

function btnSecondary(color) {
  return {
    background: `${color}22`,
    color,
    border: `1px solid ${color}44`,
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  }
}
