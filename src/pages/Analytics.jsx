import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { StatCard } from '../components/ui/Card'

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-muted w-10 text-right">{value}</span>
    </div>
  )
}

function HorizontalBar({ label, value, max, color = 'bg-primary', showPercent = false }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-text text-sm">{label}</span>
        <span className="text-text-muted text-xs">
          {value}
          {showPercent ? ` (${Math.round(pct)}%)` : ''}
        </span>
      </div>
      <div className="h-2 bg-border/30 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!business?.id) return
    setLoading(true)
    setError(null)
    analyticsApi
      .get(business.id)
      .then((data) => {
        setAnalytics(data)
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar analytics')
      })
      .finally(() => setLoading(false))
  }, [business?.id])

  if (loading) {
    return (
      <div className="px-5 pt-5 pb-20 space-y-4">
        <div className="h-8 bg-border/30 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-20 bg-border/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-5 pt-5 pb-20">
        <div className="card bg-danger/10 border-danger/20">
          <p className="text-danger font-medium text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-danger text-xs mt-2 font-medium underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="px-5 pt-5 pb-20">
        <div className="card text-center py-8">
          <p className="text-text-muted text-sm">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  const {
    total_clients = 0,
    active_clients = 0,
    optout_clients = 0,
    at_risk_clients = 0,
    messages_sent = 0,
    messages_delivered = 0,
    messages_read = 0,
    messages_failed = 0,
    responded_yes = 0,
    responded_no = 0,
    response_rate = 0,
    rated_good = 0,
    rated_bad = 0,
    satisfaction_rate = 0,
    services_completed = 0,
    follow_ups_sent = 0,
  } = analytics

  const totalResponses = responded_yes + responded_no
  const totalRatings = rated_good + rated_bad

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs">Analytics</p>
          <h1 className="text-lg font-bold text-text">Últimos 30 días</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-full bg-border/30 text-text-muted font-bold text-sm flex items-center justify-center"
        >
          ←
        </button>
      </div>

      <div className="px-5 pb-20 space-y-6">
        {/* Resumen general */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">Resumen</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Clientes activos"
              value={active_clients}
              sub={`de ${total_clients}`}
              color="text-primary"
            />
            <StatCard
              label="Mensajes (30d)"
              value={messages_sent}
              sub={`${messages_delivered} entregados`}
              color="text-success"
            />
            <StatCard
              label="Tasa respuesta"
              value={`${Math.round(response_rate)}%`}
              sub={`${totalResponses} respuestas`}
              color="text-blue-500"
            />
            <StatCard
              label="Satisfacción"
              value={`${Math.round(satisfaction_rate)}%`}
              sub={`${totalRatings} calificaciones`}
              color="text-warning"
            />
          </div>
        </section>

        {/* Mensajes WhatsApp */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">Mensajes WhatsApp</h2>
          <div className="card space-y-4">
            <HorizontalBar
              label="Enviados"
              value={messages_sent}
              max={messages_sent || 1}
              color="bg-primary"
              showPercent={false}
            />
            <HorizontalBar
              label="Entregados"
              value={messages_delivered}
              max={messages_sent || 1}
              color="bg-success"
              showPercent={true}
            />
            <HorizontalBar
              label="Leídos"
              value={messages_read}
              max={messages_sent || 1}
              color="bg-blue-500"
              showPercent={true}
            />
            <HorizontalBar
              label="Fallidos"
              value={messages_failed}
              max={messages_sent || 1}
              color="bg-danger"
              showPercent={true}
            />
          </div>
        </section>

        {/* Respuestas a recordatorios */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">
            Respuestas a recordatorios
          </h2>
          <div className="card space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-text text-sm">Respondieron SI</span>
                <span className="text-text-muted text-xs">{responded_yes}</span>
              </div>
              <div className="h-3 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: totalResponses > 0 ? (responded_yes / totalResponses) * 100 : 0 + '%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-text text-sm">Respondieron NO</span>
                <span className="text-text-muted text-xs">{responded_no}</span>
              </div>
              <div className="h-3 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full"
                  style={{ width: totalResponses > 0 ? (responded_no / totalResponses) * 100 : 0 + '%' }}
                />
              </div>
            </div>
            {totalResponses > 0 && (
              <div className="text-center pt-2 border-t border-border/30">
                <p className="text-text-muted text-xs">
                  Tasa de respuesta: <span className="text-text font-semibold">{Math.round(response_rate)}%</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Encuesta post-servicio */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">Encuesta post-servicio</h2>
          <div className="card space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-text text-sm">Bueno</span>
                <span className="text-text-muted text-xs">{rated_good}</span>
              </div>
              <div className="h-3 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: totalRatings > 0 ? (rated_good / totalRatings) * 100 : 0 + '%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-text text-sm">Malo</span>
                <span className="text-text-muted text-xs">{rated_bad}</span>
              </div>
              <div className="h-3 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger rounded-full"
                  style={{ width: totalRatings > 0 ? (rated_bad / totalRatings) * 100 : 0 + '%' }}
                />
              </div>
            </div>
            {totalRatings > 0 && (
              <div className="text-center pt-2 border-t border-border/30">
                <p className="text-text-muted text-xs">
                  Satisfacción: <span className="text-text font-semibold">{Math.round(satisfaction_rate)}%</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Estado clientes */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">Estado clientes</h2>
          <div className="card space-y-4">
            <ProgressBar value={active_clients} max={total_clients || 1} color="bg-success" />
            <ProgressBar value={at_risk_clients} max={total_clients || 1} color="bg-warning" />
            <ProgressBar value={optout_clients} max={total_clients || 1} color="bg-danger" />
            <div className="text-center pt-2 border-t border-border/30 space-y-1">
              <p className="text-text-muted text-xs">Total: {total_clients} clientes</p>
            </div>
          </div>
        </section>

        {/* Servicios completados */}
        {services_completed > 0 && (
          <section>
            <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">Actividad</h2>
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text text-sm">Servicios completados</span>
                <span className="text-primary font-semibold">{services_completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text text-sm">Seguimientos enviados</span>
                <span className="text-primary font-semibold">{follow_ups_sent}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
