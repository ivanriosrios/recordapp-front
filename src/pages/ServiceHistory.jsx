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

// ─── Rating display ─────────────────────────────────────────────────────
function RatingBadge({ rating }) {
  if (rating === null || rating === undefined) {
    return <Badge variant="muted">Pendiente</Badge>
  }
  if (rating >= 3) {
    return <Badge variant="success">Satisfecho</Badge>
  }
  return <Badge variant="danger">Insatisfecho</Badge>
}

function FollowUpBadge({ sent, rating }) {
  if (!sent) return <Badge variant="muted">Sin enviar</Badge>
  if (rating !== null && rating !== undefined) {
    return <RatingBadge rating={rating} />
  }
  return <Badge variant="warning">Esperando respuesta</Badge>
}

// ─── Lista de servicios completados ─────────────────────────────────────
function ServiceLogsList() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    serviceLogsApi.list(business.id)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [business?.id])

  const stats = {
    total: logs.length,
    rated: logs.filter((l) => l.rating !== null).length,
    good: logs.filter((l) => l.rating >= 3).length,
    bad: logs.filter((l) => l.rating !== null && l.rating < 3).length,
    pending: logs.filter((l) => l.follow_up_sent && l.rating === null).length,
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
            <p className="text-lg font-bold text-warning">{stats.pending}</p>
            <p className="text-[10px] text-text-muted">Esperando</p>
          </div>
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
          logs.map((log) => (
            <div key={log.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm truncate">
                    {log.client_name || 'Cliente'}
                  </p>
                  <p className="text-text-muted text-xs">{log.service_name || 'Servicio'}</p>
                </div>
                <FollowUpBadge sent={log.follow_up_sent} rating={log.rating} />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>📅 {formatDate(log.completed_at)}</span>
                {log.notes && (
                  <>
                    <span>•</span>
                    <span className="truncate">{log.notes}</span>
                  </>
                )}
              </div>
            </div>
          ))
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

// ─── Marcar servicio completado ─────────────────────────────────────────
function CompleteService() {
  const navigate = useNavigate()
  const { business, clients, services, setClients, setServices } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    client_id: '',
    service_id: '',
    notes: '',
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

  const handleSubmit = async () => {
    if (!form.client_id || !form.service_id) return
    setLoading(true)
    setError(null)
    try {
      await serviceLogsApi.create(business.id, {
        client_id: form.client_id,
        service_id: form.service_id,
        notes: form.notes || null,
      })
      setSuccess(true)
      setTimeout(() => navigate('/services'), 1500)
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
            <p className="text-text-muted text-sm mt-1">
              Se enviará encuesta de satisfacción en {selectedService?.follow_up_days || 2} días
            </p>
          </div>
        ) : (
          <>
            <Select
              label="Cliente *"
              value={form.client_id}
              onChange={(e) => set('client_id', e.target.value)}
              options={clientOptions}
            />

            <Select
              label="Servicio *"
              value={form.service_id}
              onChange={(e) => set('service_id', e.target.value)}
              options={serviceOptions}
            />

            {/* Info follow-up */}
            {selectedService && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
                <p className="text-text text-sm">
                  📩 Se enviará encuesta post-servicio en{' '}
                  <strong>{selectedService.follow_up_days || 2} días</strong> por WhatsApp.
                </p>
                <p className="text-text-muted text-xs mt-1">
                  El cliente recibirá un mensaje preguntando cómo le fue.
                </p>
              </div>
            )}

            <Textarea
              label="Notas (opcional)"
              placeholder="Detalles del servicio realizado..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />

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
  const { business, services, templates, setServices, addService, setTemplates, addTemplate } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(null)

  const [serviceForm, setServiceForm] = useState({ name: '', description: '', ref_price: '', follow_up_days: '' })
  const [templateForm, setTemplateForm] = useState({ name: '', body: '', type: 'reminder', channel: 'whatsapp' })

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
      }
      const svc = await servicesApi.create(business.id, payload)
      addService(svc)
      setServiceForm({ name: '', description: '', ref_price: '', follow_up_days: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.body.trim()) return
    setLoading(true)
    setError(null)
    try {
      const tpl = await templatesApi.create(business.id, {
        name: templateForm.name.trim(),
        body: templateForm.body,
        type: templateForm.type,
        channel: templateForm.channel,
      })
      addTemplate(tpl)
      setTemplateForm({ name: '', body: '', type: 'reminder', channel: 'whatsapp' })
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
        <div className="card space-y-3">
          <h3 className="font-semibold text-text">Nuevo servicio</h3>
          <Input label="Nombre" value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} />
          <Textarea label="Descripción" value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio ref." type="number" value={serviceForm.ref_price} onChange={(e) => setServiceForm((p) => ({ ...p, ref_price: e.target.value }))} />
            <Input label="Días para encuesta" type="number" value={serviceForm.follow_up_days} onChange={(e) => setServiceForm((p) => ({ ...p, follow_up_days: e.target.value }))} />
          </div>
          <Button onClick={handleCreateService} disabled={!serviceForm.name.trim() || loading}>
            Guardar servicio
          </Button>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold text-text">Nueva plantilla</h3>
          <Input label="Nombre" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} />
          <Textarea label="Mensaje" value={templateForm.body} onChange={(e) => setTemplateForm((p) => ({ ...p, body: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={templateForm.type}
              onChange={(e) => setTemplateForm((p) => ({ ...p, type: e.target.value }))}
              options={[
                { value: 'reminder', label: 'Recordatorio' },
                { value: 'promo', label: 'Promoción' },
                { value: 'reactivation', label: 'Reactivación' },
                { value: 'follow_up', label: 'Post-servicio' },
                { value: 'birthday', label: 'Cumpleaños' },
              ]}
            />
            <Select
              label="Canal"
              value={templateForm.channel}
              onChange={(e) => setTemplateForm((p) => ({ ...p, channel: e.target.value }))}
              options={[
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'email', label: 'Email' },
              ]}
            />
          </div>
          <Button onClick={handleCreateTemplate} disabled={!templateForm.name.trim() || !templateForm.body.trim() || loading}>
            Guardar plantilla
          </Button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-text font-semibold">Servicios existentes</h4>
          {services.length === 0 ? (
            <p className="text-text-muted text-sm">Aún no tienes servicios.</p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-text font-medium text-sm">{s.name}</p>
                  <p className="text-text-muted text-xs">Encuesta en {s.follow_up_days || 2} días</p>
                </div>
                {!s.is_active && <Badge variant="muted">Inactivo</Badge>}
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-text font-semibold">Plantillas existentes</h4>
          {templates.length === 0 ? (
            <p className="text-text-muted text-sm">Aún no tienes plantillas.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-text font-medium text-sm">{t.name}</p>
                    <p className="text-text-muted text-xs capitalize">{t.type}</p>
                  </div>
                  <Badge variant="muted">{t.channel}</Badge>
                </div>
              </div>
            ))
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
