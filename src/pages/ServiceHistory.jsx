import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { serviceLogsApi, servicesApi, clientsApi, templatesApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Input, Textarea } from '../components/ui/Input'
import Header from '../components/layout/Header'
import { formatDate } from '../utils/format'

const TYPE_LABEL = {
  reminder: 'Recordatorio',
  promo: 'Promoción',
  reactivation: 'Reactivación',
  follow_up: 'Post-servicio',
  birthday: 'Cumpleaños',
}

const STATUS_BADGE = {
  approved: { variant: 'success', label: 'Activa' },
  pending: { variant: 'warning', label: 'En revisión' },
  rejected: { variant: 'danger', label: 'Rechazada' },
}

// ─── Helpers de fecha ────────────────────────────────────────────────────
function scheduledLabel(completedAt, followUpDays) {
  const days = followUpDays ?? 2
  const sendAt = new Date(completedAt)
  sendAt.setDate(sendAt.getDate() + days)
  const now = new Date()
  const diff = Math.ceil((sendAt - now) / 86400000)
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `En ${diff} días`
}

// ─── Rating display ─────────────────────────────────────────────────────
function FollowUpBadge({ sent, rating, completedAt, followUpDays }) {
  // Aún no enviada — mostrar cuándo se enviará
  if (!sent) {
    const label = scheduledLabel(completedAt, followUpDays)
    const isUrgent = label === 'Hoy' || label === 'Mañana'
    return (
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: isUrgent ? '#f59e0b' : '#64748b',
        background: isUrgent ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)',
        border: `1px solid ${isUrgent ? 'rgba(245,158,11,0.25)' : 'rgba(100,116,139,0.2)'}`,
        borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap',
      }}>
        📩 {label}
      </span>
    )
  }
  // Enviada, esperando respuesta
  if (rating === null || rating === undefined) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 600, color: '#818cf8',
        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap',
      }}>
        💬 Esperando
      </span>
    )
  }
  // Calificada
  if (rating >= 3) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 600, color: '#10b981',
        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap',
      }}>
        ⭐ Satisfecho
      </span>
    )
  }
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: '#ef4444',
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      😟 Insatisfecho
    </span>
  )
}

// ─── Lista de servicios completados ─────────────────────────────────────
function ServiceLogsList() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!business?.id) return
    serviceLogsApi.list(business.id)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [business?.id])

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const stats = {
    total: logs.length,
    good: logs.filter((l) => l.rating >= 3).length,
    bad: logs.filter((l) => l.rating !== null && l.rating < 3).length,
    waiting: logs.filter((l) => l.follow_up_sent && l.rating === null).length,
    scheduled: logs.filter((l) => !l.follow_up_sent).length,
  }

  return (
    <div>
      <Header
        title="Servicios"
        onBack={false}
        rightAction={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/services/manage')}
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/services/complete')}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[72px]">
            <p className="text-lg font-bold text-text">{stats.total}</p>
            <p className="text-[10px] text-text-muted">Total</p>
          </div>
          <div className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[72px]">
            <p className="text-lg font-bold text-success">{stats.good}</p>
            <p className="text-[10px] text-text-muted">Satisfechos</p>
          </div>
          <div className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[72px]">
            <p className="text-lg font-bold text-danger">{stats.bad}</p>
            <p className="text-[10px] text-text-muted">Insatisfechos</p>
          </div>
          <div className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[72px]">
            <p className="text-lg font-bold text-primary">{stats.waiting}</p>
            <p className="text-[10px] text-text-muted">Esperando</p>
          </div>
          <div className="flex-shrink-0 bg-card border border-border rounded-xl px-3 py-2 text-center min-w-[72px]">
            <p className="text-lg font-bold text-warning">{stats.scheduled}</p>
            <p className="text-[10px] text-text-muted">Prog.</p>
          </div>
        </div>

        {/* Leyenda del flujo */}
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Flujo: Servicio completado → <span style={{ color: '#f59e0b' }}>📩 Encuesta programada</span> → <span style={{ color: '#818cf8' }}>💬 Esperando respuesta</span> → <span style={{ color: '#10b981' }}>⭐ Satisfecho</span> / <span style={{ color: '#ef4444' }}>😟 Insatisfecho</span>
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="px-5 space-y-2">
        {loading ? (
          <div className="text-center text-text-muted text-sm py-8">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-text-muted text-sm">Sin servicios completados aún</p>
            <button
              onClick={() => navigate('/services/complete')}
              className="text-primary text-sm font-medium mt-2"
            >
              + Marcar servicio completado
            </button>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id
            const sendAt = (() => {
              const d = new Date(log.completed_at)
              d.setDate(d.getDate() + (log.follow_up_days ?? 2))
              return d
            })()
            const payLabel = { efectivo: '💵 Efectivo', tarjeta: '💳 Tarjeta', transferencia: '🏦 Transferencia' }
            return (
              <div
                key={log.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.2s', borderColor: isExpanded ? 'rgba(99,102,241,0.4)' : undefined }}
                onClick={() => toggleExpand(log.id)}
              >
                {/* Fila principal */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm truncate">{log.client_name || 'Cliente'}</p>
                    <p className="text-text-muted text-xs">{log.service_name || 'Servicio'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {log.price_charged != null && (
                      <span className="text-sm font-semibold text-text">
                        ${Number(log.price_charged).toLocaleString('es-CO')}
                      </span>
                    )}
                    <FollowUpBadge
                      sent={log.follow_up_sent}
                      rating={log.rating}
                      completedAt={log.completed_at}
                      followUpDays={log.follow_up_days}
                    />
                  </div>
                </div>

                {/* Info base */}
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                  <span>📅 {formatDate(log.completed_at)}</span>
                  {log.payment_method && (
                    <><span>•</span><span>{payLabel[log.payment_method] || log.payment_method}</span></>
                  )}
                  {!isExpanded && log.notes && (
                    <><span>•</span><span className="truncate">{log.notes}</span></>
                  )}
                  <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 11 }}>
                    {isExpanded ? '▲ Menos' : '▼ Ver más'}
                  </span>
                </div>

                {/* Panel expandido */}
                {isExpanded && (
                  <div
                    style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(99,102,241,0.15)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Estado encuesta */}
                    <div style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(99,102,241,0.06)', borderRadius: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado encuesta post-servicio</p>
                      {!log.follow_up_sent ? (
                        <p style={{ fontSize: 12, color: '#f59e0b', margin: 0 }}>
                          📩 Se enviará automáticamente el <strong>{sendAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}</strong>
                        </p>
                      ) : log.rating === null ? (
                        <p style={{ fontSize: 12, color: '#818cf8', margin: 0 }}>💬 Encuesta enviada — esperando respuesta del cliente</p>
                      ) : log.rating >= 3 ? (
                        <p style={{ fontSize: 12, color: '#10b981', margin: 0 }}>⭐ Cliente <strong>satisfecho</strong> con el servicio</p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>😟 Cliente <strong>insatisfecho</strong> — considera hacer seguimiento</p>
                      )}
                    </div>

                    {/* Detalles del cierre */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {log.price_charged != null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>💰 Cobrado</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>${Number(log.price_charged).toLocaleString('es-CO')}</span>
                        </div>
                      )}
                      {log.payment_method && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>💳 Método de pago</span>
                          <span style={{ fontSize: 12, color: '#e2e8f0' }}>{payLabel[log.payment_method] || log.payment_method}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>📅 Fecha y hora</span>
                        <span style={{ fontSize: 12, color: '#e2e8f0' }}>
                          {new Date(log.completed_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {log.summary_sent && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>📱 Comprobante</span>
                          <span style={{ fontSize: 12, color: '#10b981' }}>Enviado por WhatsApp</span>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {(log.service_notes || log.notes) && (
                      <div style={{ marginTop: 10, padding: '8px 10px', background: '#1a1d2e', borderRadius: 8 }}>
                        {log.service_notes && (
                          <div style={{ marginBottom: log.notes ? 6 : 0 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', margin: '0 0 2px', textTransform: 'uppercase' }}>Notas del servicio</p>
                            <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>{log.service_notes}</p>
                          </div>
                        )}
                        {log.notes && (
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', margin: '0 0 2px', textTransform: 'uppercase' }}>Notas generales</p>
                            <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>{log.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/services/complete')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:bg-primary-dark"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  )
}

const PAYMENT_OPTIONS = [
  { value: '', label: 'Método de pago...' },
  { value: 'efectivo', label: 'Efectivo 💵' },
  { value: 'tarjeta', label: 'Tarjeta 💳' },
  { value: 'transferencia', label: 'Transferencia 🏦' },
  { value: 'otro', label: 'Otro' },
]

// ─── Marcar servicio completado ─────────────────────────────────────────
function CompleteService() {
  const navigate = useNavigate()
  const { business, clients, services, setClients, setServices } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [summaryWasSent, setSummaryWasSent] = useState(false)

  const [form, setForm] = useState({
    client_id: '',
    service_id: '',
    notes: '',
    price_charged: '',
    payment_method: '',
    service_notes: '',
    send_summary: false,
  })

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  useEffect(() => {
    if (!business?.id) return
    Promise.all([
      clientsApi.list(business.id),
      servicesApi.list(business.id),
    ]).then(([c, s]) => {
      setClients(c)
      setServices(s)
    }).finally(() => setLoadingData(false))
  }, [business?.id])

  const selectedService = services.find((s) => s.id === form.service_id)

  // Pre-fill price when service is selected
  const handleServiceChange = (e) => {
    const svcId = e.target.value
    const svc = services.find((s) => s.id === svcId)
    setForm((p) => ({
      ...p,
      service_id: svcId,
      price_charged: svc?.ref_price != null ? String(svc.ref_price) : p.price_charged,
    }))
  }

  const handleSubmit = async () => {
    if (!form.client_id || !form.service_id) return
    setLoading(true)
    setError(null)
    try {
      // 1. Create the base service log
      const log = await serviceLogsApi.create(business.id, {
        client_id: form.client_id,
        service_id: form.service_id,
        notes: form.notes || null,
      })

      // 2. If any close-service fields provided, call /complete
      const hasCloseData = form.price_charged || form.payment_method || form.service_notes || form.send_summary
      if (hasCloseData) {
        await serviceLogsApi.complete(business.id, log.id, {
          price_charged: form.price_charged ? Number(form.price_charged) : null,
          payment_method: form.payment_method || null,
          service_notes: form.service_notes || null,
          send_summary: form.send_summary,
        })
        setSummaryWasSent(form.send_summary)
      }

      setSuccess(true)
      setTimeout(() => navigate('/services'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clientOptions = [
    { value: '', label: 'Seleccionar cliente...' },
    ...clients.filter((c) => c.status === 'active').map((c) => ({
      value: c.id,
      label: c.full_name ? `${c.display_name} (${c.full_name})` : c.display_name,
    })),
  ]

  const serviceOptions = [
    { value: '', label: 'Seleccionar servicio...' },
    ...services.filter((s) => s.is_active).map((s) => ({
      value: s.id,
      label: s.name,
    })),
  ]

  if (loadingData) {
    return (
      <div>
        <Header title="Servicio completado" />
        <div className="p-5 text-center text-text-muted text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Servicio completado" />
      <div className="px-5 pb-6">
        {success ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-text font-semibold text-lg">Servicio registrado</p>
            {summaryWasSent && (
              <p className="text-text-muted text-sm mt-1">📱 Comprobante enviado por WhatsApp</p>
            )}
            <p className="text-text-muted text-sm mt-1">
              Se enviará encuesta de satisfacción en {selectedService?.follow_up_days || 2} días
            </p>
          </div>
        ) : (
          <>
            {/* Cliente y servicio */}
            <Select
              label="Cliente *"
              value={form.client_id}
              onChange={(e) => set('client_id', e.target.value)}
              options={clientOptions}
            />

            <Select
              label="Servicio *"
              value={form.service_id}
              onChange={handleServiceChange}
              options={serviceOptions}
            />

            {/* Info follow-up */}
            {selectedService && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                <p className="text-text text-sm">
                  📩 Se enviará encuesta post-servicio en{' '}
                  <strong>{selectedService.follow_up_days || 2} días</strong> por WhatsApp.
                </p>
              </div>
            )}

            {/* Cierre de servicio */}
            <div className="card mb-4 space-y-3">
              <h3 className="font-semibold text-text text-sm">Cierre del servicio</h3>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total cobrado"
                  type="number"
                  placeholder="0"
                  value={form.price_charged}
                  onChange={(e) => set('price_charged', e.target.value)}
                />
                <Select
                  label="Método de pago"
                  value={form.payment_method}
                  onChange={(e) => set('payment_method', e.target.value)}
                  options={PAYMENT_OPTIONS}
                />
              </div>

              <Textarea
                label="Notas del servicio"
                placeholder="Ej: Se aplicó tinte caoba, próxima visita en 4 semanas..."
                value={form.service_notes}
                onChange={(e) => set('service_notes', e.target.value)}
              />
            </div>

            {/* Notas generales */}
            <Textarea
              label="Notas generales (opcional)"
              placeholder="Observaciones internas..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />

            {/* Toggle comprobante WhatsApp */}
            <div
              className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4 cursor-pointer"
              onClick={() => set('send_summary', !form.send_summary)}
            >
              <div>
                <p className="text-text text-sm font-medium">Enviar comprobante por WhatsApp</p>
                <p className="text-text-muted text-xs">Resumen del servicio al cliente</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors ${form.send_summary ? 'bg-primary' : 'bg-border'} relative`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.send_summary ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 text-danger text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!form.client_id || !form.service_id || loading}
            >
              {loading ? 'Registrando...' : 'Marcar como completado'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Gestionar servicios y plantillas ───────────────────────────────────
function ManageServicesTemplates() {
  const navigate = useNavigate()
  const { business, services, templates, setServices, addService, setTemplates } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(null)

  const [serviceForm, setServiceForm] = useState({ name: '', description: '', ref_price: '', follow_up_days: '', estimated_duration_minutes: '' })

  useEffect(() => {
    if (!business?.id) return
    Promise.all([
      servicesApi.list(business.id),
      templatesApi.list(business.id),
    ]).then(([s, t]) => {
      setServices(s)
      setTemplates(t)
    }).finally(() => setLoadingData(false))
  }, [business?.id])

  const handleCreateService = async () => {
    if (!serviceForm.name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description || null,
        ref_price: serviceForm.ref_price ? Number(serviceForm.ref_price) : null,
        follow_up_days: serviceForm.follow_up_days ? Number(serviceForm.follow_up_days) : null,
        estimated_duration_minutes: serviceForm.estimated_duration_minutes ? Number(serviceForm.estimated_duration_minutes) : null,
      }
      const svc = await servicesApi.create(business.id, payload)
      addService(svc)
      setServiceForm({ name: '', description: '', ref_price: '', follow_up_days: '', estimated_duration_minutes: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div>
        <Header title="Servicios y plantillas" onBack={() => navigate(-1)} />
        <div className="p-5 text-center text-text-muted text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Servicios y plantillas" onBack={() => navigate(-1)} />
      <div className="px-5 pb-6 space-y-6">
        {/* Crear servicio */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-text">Nuevo servicio</h3>
          <Input label="Nombre" value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} />
          <Textarea label="Descripción" value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio ref." type="number" value={serviceForm.ref_price} onChange={(e) => setServiceForm((p) => ({ ...p, ref_price: e.target.value }))} />
            <Input label="Días para encuesta" type="number" value={serviceForm.follow_up_days} onChange={(e) => setServiceForm((p) => ({ ...p, follow_up_days: e.target.value }))} />
            <Input label="Duración (min)" type="number" placeholder="30" value={serviceForm.estimated_duration_minutes} onChange={(e) => setServiceForm((p) => ({ ...p, estimated_duration_minutes: e.target.value }))} />
          </div>
          <Button onClick={handleCreateService} disabled={!serviceForm.name.trim() || loading}>
            Guardar servicio
          </Button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Servicios existentes */}
        <div className="space-y-2">
          <h4 className="text-text font-semibold">Servicios existentes</h4>
          {services.length === 0 ? (
            <p className="text-text-muted text-sm">Aún no tienes servicios.</p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-text font-medium text-sm">{s.name}</p>
                  <p className="text-text-muted text-xs">
                    Encuesta en {s.follow_up_days || 2} días
                    {s.ref_price != null && ` · $${Number(s.ref_price).toLocaleString('es-CO')}`}
                    {s.estimated_duration_minutes && ` · ${s.estimated_duration_minutes} min`}
                  </p>
                </div>
                {!s.is_active && <Badge variant="muted">Inactivo</Badge>}
              </div>
            ))
          )}
        </div>

        {/* Plantillas de WhatsApp (solo lectura) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-text font-semibold">Plantillas de WhatsApp</h4>
            <span className="text-text-muted text-xs">Pre-aprobadas por Meta</span>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-2">
            <p className="text-text-muted text-xs">
              Estas plantillas están aprobadas por WhatsApp y se usan automáticamente según el tipo de mensaje. No es necesario crear nuevas.
            </p>
          </div>
          {templates.length === 0 ? (
            <p className="text-text-muted text-sm">Cargando plantillas...</p>
          ) : (
            templates.map((t) => {
              const statusInfo = STATUS_BADGE[t.status] || STATUS_BADGE.approved
              return (
                <div key={t.id} className="card">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-text font-medium text-sm">{t.name}</p>
                      <p className="text-text-muted text-xs">{TYPE_LABEL[t.type] || t.type}</p>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                  {/* Preview del mensaje */}
                  <div className="bg-[#075e54] rounded-lg p-2.5 text-white text-xs leading-relaxed">
                    {t.body}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Router ─────────────────────────────────────────────────────────────
export default function ServiceHistoryPage() {
  return (
    <Routes>
      <Route index element={<ServiceLogsList />} />
      <Route path="complete" element={<CompleteService />} />
      <Route path="manage" element={<ManageServicesTemplates />} />
    </Routes>
  )
}
