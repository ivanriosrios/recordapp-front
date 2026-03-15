import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsApi, remindersApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { StatCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { daysSince, formatDate } from '../utils/format'

function RatingStars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-warning' : 'text-border'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { business, clients, setClients } = useAppStore()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    Promise.all([
      clientsApi.list(business.id),
      remindersApi.list(business.id, { upcoming_days: 7 }),
    ]).then(([c, r]) => {
      setClients(c)
      setReminders(r)
    }).finally(() => setLoading(false))
  }, [business?.id])

  const atRisk = clients.filter((c) => daysSince(c.updated_at) > 60 && c.status === 'active')
  const activeClients = clients.filter((c) => c.status === 'active').length
  const upcomingCount = reminders.filter((r) => r.status === 'active').length

  const businessType = business?.business_type || 'negocio'

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs">Bienvenido de nuevo</p>
          <h1 className="text-lg font-bold text-text">{business?.name}</h1>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center"
        >
          {(business?.name || 'R')[0].toUpperCase()}
        </button>
      </div>

      <div className="px-5 pb-6 space-y-5">
        {/* Stats */}
        <div className="flex gap-3">
          <StatCard label="Clientes activos" value={loading ? '—' : activeClients} />
          <StatCard label="Recordatorios próximos" value={loading ? '—' : upcomingCount} color="text-warning" />
          <StatCard label="En riesgo" value={loading ? '—' : atRisk.length} color="text-danger" />
        </div>

        {/* Envío masivo */}
        <button
          onClick={() => navigate('/reminders/new')}
          className="w-full card border-primary/30 bg-primary/5 flex items-center gap-3 text-left active:opacity-75"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">📢</div>
          <div>
            <p className="font-semibold text-text text-sm">Envío masivo</p>
            <p className="text-text-muted text-xs">Envía a un segmento de clientes</p>
          </div>
          <svg className="w-4 h-4 text-text-muted ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Clientes en riesgo */}
        {atRisk.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-text text-sm">Clientes en riesgo</h2>
              <button onClick={() => navigate('/clients')} className="text-primary text-xs">Ver todos</button>
            </div>
            <div className="space-y-2">
              {atRisk.slice(0, 3).map((c) => {
                const dias = daysSince(c.updated_at)
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="w-full card flex items-center gap-3 text-left active:opacity-75"
                  >
                    <div className="w-9 h-9 rounded-full bg-danger/20 text-danger font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {c.display_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text text-sm truncate">{c.display_name}</p>
                      <p className="text-text-muted text-xs">Sin visita hace {dias} días</p>
                    </div>
                    <Badge variant="danger">{dias}d</Badge>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Próximos recordatorios */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-text text-sm">Próximos recordatorios</h2>
            <button onClick={() => navigate('/reminders')} className="text-primary text-xs">Ver todos</button>
          </div>
          {loading ? (
            <div className="text-text-muted text-sm text-center py-4">Cargando...</div>
          ) : reminders.length === 0 ? (
            <div className="card text-center py-4">
              <p className="text-text-muted text-sm">Sin recordatorios próximos</p>
              <button onClick={() => navigate('/reminders/new')} className="text-primary text-sm font-medium mt-1">
                + Crear uno
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.slice(0, 4).map((r) => (
                <div key={r.id} className="card flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-lg flex-shrink-0">🔔</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-medium truncate">
                      {clients.find((c) => c.id === r.client_id)?.display_name || 'Cliente'}
                    </p>
                    <p className="text-text-muted text-xs">{r.next_send_date ? formatDate(r.next_send_date) : '—'}</p>
                  </div>
                  <Badge variant="success">Activo</Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acceso rápido */}
        <section>
          <h2 className="font-semibold text-text text-sm mb-2">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '👤', label: 'Nuevo cliente', action: () => navigate('/clients/new') },
              { icon: '🔔', label: 'Nuevo recordatorio', action: () => navigate('/reminders/new') },
              { icon: '📊', label: 'Analytics', action: () => navigate('/analytics') },
              { icon: '⚙️', label: 'Configuración', action: () => navigate('/settings') },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="card flex items-center gap-2 text-left active:opacity-75"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-text text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
