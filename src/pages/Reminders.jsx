import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { remindersApi, clientsApi, servicesApi, templatesApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import Header from '../components/layout/Header'
import { clientLabel, formatDate } from '../utils/format'

const STATUS_VARIANT = { active: 'success', paused: 'warning', done: 'muted' }
const STATUS_LABEL   = { active: 'Activo', paused: 'Pausado', done: 'Listo' }

const TYPE_LABEL = {
  reminder: 'Recordatorio',
  promo: 'Promoción',
  reactivation: 'Reactivación',
  follow_up: 'Post-servicio',
  birthday: 'Cumpleaños',
}

// ─── Lista de recordatorios ──────────────────────────────────────────────
function RemindersList() {
  const navigate = useNavigate()
  const { business, clients, services } = useAppStore()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    if (!business?.id) return
    remindersApi.list(business.id).then(setReminders).finally(() => setLoading(false))
  }, [business?.id])

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const sendNow = async (id) => {
    if (!business?.id) return
    setSending(true)
    setError(null)
    try {
      await remindersApi.sendNow(business.id, id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const sendSelected = async () => {
    if (!business?.id || selected.size === 0) return
    setSending(true)
    setError(null)
    try {
      await remindersApi.sendBulkNow(business.id, Array.from(selected))
      setSelected(new Set())
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const getClient = (id) => clients.find((c) => c.id === id)
  const getService = (id) => services.find((s) => s.id === id)

  const filtered = reminders.filter((r) =>
    tab === 'active' ? r.status === 'active' :
    tab === 'done' ? r.status === 'done' :
    tab === 'paused' ? r.status === 'paused' : true
  )

  const sendAllActive = async () => {
    if (!business?.id) return
    const ids = reminders.filter((r) => r.status === 'active').map((r) => r.id)
    if (ids.length === 0) return
    setSending(true)
    setError(null)
    try {
      await remindersApi.sendBulkNow(business.id, ids)
      setSelected(new Set())
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <Header
        title="Recordatorios"
        onBack={false}
        rightAction={
          <button
            onClick={() => navigate('/reminders/new')}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex px-5 gap-1 mb-4 border-b border-border">
        {[{ key: 'active', label: 'Próximos' }, { key: 'done', label: 'Enviados' }, { key: 'all', label: 'Todos' }, { key: 'paused', label: 'Pausados' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">{error}</div>
        )}
        {selected.size > 0 && (
          <div className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2 text-sm">
            <span>{selected.size} seleccionados</span>
            <Button size="sm" onClick={sendSelected} disabled={sending}>Enviar ahora</Button>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={sendAllActive} disabled={sending}>
              Enviar todos los activos
            </Button>
          </div>
        )}
        {loading ? (
          <div className="text-center text-text-muted text-sm py-8">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-text-muted text-sm">Sin recordatorios {tab === 'paused' ? 'pausados' : tab === 'done' ? 'enviados' : 'activos'}</p>
            <button onClick={() => navigate('/reminders/new')} className="text-primary text-sm font-medium mt-2">
              + Crear recordatorio
            </button>
          </div>
        ) : (
          filtered.map((r) => {
            const client = getClient(r.client_id)
            const service = getService(r.service_id)
            return (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm truncate">
                      {client?.display_name || 'Cliente'}
                    </p>
                    <p className="text-text-muted text-xs">{service?.name || 'Servicio'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelected(r.id)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span>📅 {r.next_send_date ? formatDate(r.next_send_date) : '—'}</span>
                  <span>•</span>
                  <span>{r.type === 'recurring' ? `Cada ${r.recurrence_days}d` : 'Una vez'}</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <Button size="sm" variant="secondary" onClick={() => sendNow(r.id)} disabled={sending}>Enviar ahora</Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/reminders/new')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// ─── Nuevo recordatorio ──────────────────────────────────────────────────
function NewReminder() {
  const navigate = useNavigate()
  const location = useLocation()
  const { business, clients, services, templates, setServices, setTemplates } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  const [form, setForm] = useState({
    client_id: location.state?.clientId || '',
    service_id: '',
    template_id: '',
    type: 'one_time',
    next_send_date: '',
    recurrence_days: '',
    notify_days_before: '3',
  })

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

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

  const selectedTemplate = templates.find((t) => t.id === form.template_id)
  const isPostService = selectedTemplate?.type === 'follow_up'

  const selectedClient = clients.find((c) => c.id === form.client_id)
  const selectedService = services.find((s) => s.id === form.service_id)

  const handleSubmit = async () => {
    if (!form.client_id || !form.service_id || !form.template_id) return
    if (!form.next_send_date && !isPostService) {
      setError('Selecciona una fecha de envío')
      return
    }

    // Siempre enviar números, nunca null, para evitar 422 en el backend
    const notifyDays = parseInt(form.notify_days_before || '0') || 0
    const recurrence = form.type === 'recurring' && !isPostService
      ? parseInt(form.recurrence_days || '0') || null
      : null

    // Para plantillas de post-servicio, usar la fecha actual si no viene una
    const nextDate = (form.next_send_date || new Date().toISOString().slice(0, 10))

    setLoading(true)
    setError(null)
    try {
      const payload = {
        client_id: form.client_id,
        service_id: form.service_id,
        template_id: form.template_id,
        type: isPostService ? 'one_time' : form.type,
        next_send_date: nextDate,
        recurrence_days: recurrence,
        notify_days_before: notifyDays,
      }
      await remindersApi.create(business.id, payload)
      navigate('/reminders')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clientOptions = [
    { value: '', label: 'Seleccionar cliente...' },
    ...clients.map((c) => ({ value: c.id, label: clientLabel(c) })),
  ]
  const serviceOptions = [
    { value: '', label: 'Seleccionar servicio...' },
    ...services.map((s) => ({ value: s.id, label: s.name })),
  ]
  const templateOptions = [
    { value: '', label: 'Seleccionar plantilla...' },
    ...templates.map((t) => ({ value: t.id, label: `${t.name} (${TYPE_LABEL[t.type] || t.type})` })),
  ]

  if (loadingData) {
    return (
      <div>
        <Header title="Nuevo recordatorio" />
        <div className="p-5 text-center text-text-muted text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Nuevo recordatorio" />
      <div className="px-5 pb-6">
        <Select label="Cliente *" value={form.client_id} onChange={(e) => set('client_id', e.target.value)} options={clientOptions} />
        <Select label="Servicio *" value={form.service_id} onChange={(e) => set('service_id', e.target.value)} options={serviceOptions} />
        <Select label="Plantilla *" value={form.template_id} onChange={(e) => set('template_id', e.target.value)} options={templateOptions} />

        {/* Preview del mensaje */}
        {selectedTemplate && (
          <div className="bg-card rounded-2xl p-4 mb-4 border border-border">
            <p className="text-text-muted text-xs mb-2">Vista previa</p>
            <div className="bg-[#075e54] rounded-xl p-3 text-white text-sm leading-relaxed">
              {selectedTemplate.body
                .replace('{nombre_cliente}', selectedClient?.display_name || 'Cliente')
                .replace('{servicio}', selectedService?.name || 'servicio')
                .replace('{negocio}', business?.name || 'negocio')}
            </div>
            {isPostService && (
              <p className="text-primary text-xs mt-2">
                El cliente responde BIEN o MAL — se registra automáticamente.
              </p>
            )}
          </div>
        )}

        {/* Tipo — solo si no es post-servicio */}
        {!isPostService && (
          <div className="mb-4">
            <label className="block text-text-muted text-xs font-medium mb-1.5">Tipo</label>
            <div className="flex gap-2">
              {[{ v: 'one_time', l: 'Una vez' }, { v: 'recurring', l: 'Recurrente' }].map((t) => (
                <button
                  key={t.v}
                  onClick={() => set('type', t.v)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    form.type === t.v
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-muted'
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {isPostService ? (
          <Input label="Días después del servicio" type="number" placeholder="2" value={form.notify_days_before} onChange={(e) => set('notify_days_before', e.target.value)} />
        ) : (
          <>
            <Input label="Fecha de envío" type="date" value={form.next_send_date} onChange={(e) => set('next_send_date', e.target.value)} />
            {form.type === 'recurring' && (
              <Input label="Repetir cada (días)" type="number" placeholder="90" value={form.recurrence_days} onChange={(e) => set('recurrence_days', e.target.value)} />
            )}
            <Input label="Avisar días antes" type="number" placeholder="3" value={form.notify_days_before} onChange={(e) => set('notify_days_before', e.target.value)} />
          </>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 text-danger text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!form.client_id || !form.service_id || !form.template_id || loading}
        >
          {loading ? 'Guardando...' : 'Crear recordatorio'}
        </Button>
      </div>
    </div>
  )
}

// ─── Router ──────────────────────────────────────────────────────────────
export default function RemindersPage() {
  return (
    <Routes>
      <Route index element={<RemindersList />} />
      <Route path="new" element={<NewReminder />} />
    </Routes>
  )
}
