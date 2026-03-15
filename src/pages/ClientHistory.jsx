import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientHistoryApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { StatCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../utils/format'

function RatingStars({ rating }) {
  if (!rating) return <span className="text-text-muted text-xs">Sin calificación</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? 'text-warning' : 'text-border'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const variants = {
    sent: 'primary',
    delivered: 'success',
    read: 'success',
    responded_yes: 'success',
    responded_no: 'warning',
    failed: 'danger',
    rated_good: 'success',
    rated_bad: 'danger',
  }
  const labels = {
    sent: 'Enviado',
    delivered: 'Entregado',
    read: 'Leído',
    responded_yes: 'Sí',
    responded_no: 'No',
    failed: 'Fallo',
    rated_good: 'Bien',
    rated_bad: 'Mal',
  }
  return (
    <Badge variant={variants[status] || 'muted'}>
      {labels[status] || status}
    </Badge>
  )
}

export default function ClientHistoryPage() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { business } = useAppStore()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!business?.id || !clientId) return
    loadHistory()
  }, [business?.id, clientId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await clientHistoryApi.getHistory(business.id, clientId)
      setHistory(data)
    } catch (err) {
      console.error('Error loading history:', err)
      setError(err.message || 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-5 pb-20 space-y-4">
        <div className="h-12 bg-border/30 rounded animate-pulse" />
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
        <button
          onClick={() => navigate(-1)}
          className="mb-4 w-9 h-9 rounded-full bg-border/30 text-text-muted font-bold text-sm flex items-center justify-center"
        >
          ←
        </button>
        <div className="card bg-danger/10 border-danger/20">
          <p className="text-danger font-medium text-sm">{error}</p>
          <button
            onClick={loadHistory}
            className="text-danger text-xs mt-2 font-medium underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!history) {
    return (
      <div className="px-5 pt-5 pb-20">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 w-9 h-9 rounded-full bg-border/30 text-text-muted font-bold text-sm flex items-center justify-center"
        >
          ←
        </button>
        <div className="card text-center py-8">
          <p className="text-text-muted text-sm">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  const { client, stats, service_logs, reminder_logs } = history

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs">Cliente</p>
          <h1 className="text-lg font-bold text-text">{client.display_name}</h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-border/30 text-text-muted font-bold text-sm flex items-center justify-center"
        >
          ←
        </button>
      </div>

      <div className="px-5 pb-20 space-y-6">
        {/* Estadísticas principales */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">
            Resumen
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Servicios"
              value={stats.total_services}
              color="text-primary"
            />
            <StatCard
              label="Recordatorios"
              value={stats.total_reminders_sent}
              color="text-success"
            />
            <StatCard
              label="Tasa respuesta"
              value={`${Math.round(stats.response_rate)}%`}
              sub={`${Math.round((stats.total_reminders_sent * stats.response_rate) / 100)} respuestas`}
              color="text-blue-500"
            />
            <StatCard
              label="Promedio rating"
              value={stats.avg_rating.toFixed(1)}
              sub="sobre 5"
              color="text-warning"
            />
          </div>
        </section>

        {/* Información del cliente */}
        <section>
          <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">
            Información
          </h2>
          <div className="card space-y-3">
            <div>
              <p className="text-text-muted text-xs">Teléfono</p>
              <p className="text-text text-sm font-medium">{client.phone}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Estado</p>
              <Badge variant={client.status === 'active' ? 'success' : 'danger'}>
                {client.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div>
              <p className="text-text-muted text-xs">Cliente desde</p>
              <p className="text-text text-sm font-medium">
                {formatDate(client.created_at)}
              </p>
            </div>
            {stats.last_service_date && (
              <div>
                <p className="text-text-muted text-xs">Último servicio</p>
                <p className="text-text text-sm font-medium">
                  {formatDate(stats.last_service_date)}
                  {stats.days_since_last_visit !== null && (
                    <span className="text-text-muted text-xs ml-1">
                      (hace {stats.days_since_last_visit} días)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Servicios completados */}
        {service_logs.length > 0 && (
          <section>
            <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">
              Servicios completados ({service_logs.length})
            </h2>
            <div className="space-y-2">
              {service_logs.map((log) => (
                <div key={log.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text text-sm">
                        {log.service_name}
                      </p>
                      <p className="text-text-muted text-xs">
                        {formatDate(log.completed_at)}
                      </p>
                      {log.notes && (
                        <p className="text-text-muted text-xs mt-1">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <RatingStars rating={log.rating} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recordatorios enviados */}
        {reminder_logs.length > 0 && (
          <section>
            <h2 className="font-semibold text-text text-xs mb-3 px-1 uppercase tracking-wide">
              Recordatorios ({reminder_logs.length})
            </h2>
            <div className="space-y-2">
              {reminder_logs.map((log) => (
                <div key={log.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-text text-sm font-medium">
                          {formatDate(log.sent_at)}
                        </p>
                        <StatusBadge status={log.status} />
                      </div>
                      {log.client_response && (
                        <p className="text-text-muted text-xs mt-1">
                          Respuesta: {log.client_response}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {service_logs.length === 0 && reminder_logs.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-text-muted text-sm">
              Sin historial disponible
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
