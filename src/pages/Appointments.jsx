import { useState, useEffect, useCallback } from 'react'
import { appointmentsApi, scheduleApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import Header from '../components/layout/Header'

// ─── Constantes de UI ─────────────────────────────────────────────────────────

const STATUS_LABEL = {
  requested:  'Pendiente',
  confirmed:  'Confirmada',
  rejected:   'Rechazada',
  completed:  'Completada',
  cancelled:  'Cancelada',
}

const STATUS_VARIANT = {
  requested: 'warning',
  confirmed: 'success',
  rejected:  'danger',
  completed: 'muted',
  cancelled: 'muted',
}

const SHIFT_LABEL = {
  morning:   'Mañana',
  afternoon: 'Tarde',
  evening:   'Noche',
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = [
  '', 'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function formatApptDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAYS_ES[date.getDay()]} ${d} ${MONTHS_ES[m]}`
}

function formatApptTime(time, shift) {
  if (time) return time.slice(0, 5)
  if (shift) return SHIFT_LABEL[shift] || shift
  return '—'
}

// ─── Tarjeta de cita ──────────────────────────────────────────────────────────

function AppointmentCard({ appt, onConfirm, onReject, onComplete, loading }) {
  const isPending   = appt.status === 'requested'
  const isConfirmed = appt.status === 'confirmed'

  return (
    <div className="card p-4 space-y-3">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-text truncate">
            {appt.client_name || 'Cliente'}
          </p>
          <p className="text-sm text-text-muted truncate">
            {appt.service_name || '—'}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[appt.status]} className="shrink-0">
          {STATUS_LABEL[appt.status]}
        </Badge>
      </div>

      {/* Fecha y hora */}
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatApptDate(appt.appointment_date)}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatApptTime(appt.appointment_time, appt.shift)}
        </span>
      </div>

      {/* Acciones */}
      {isPending && (
        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            loading={loading === `confirm-${appt.id}`}
            onClick={() => onConfirm(appt.id)}
          >
            Confirmar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            loading={loading === `reject-${appt.id}`}
            onClick={() => onReject(appt.id)}
          >
            Rechazar
          </Button>
        </div>
      )}

      {isConfirmed && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            loading={loading === `complete-${appt.id}`}
            onClick={() => onComplete(appt.id)}
          >
            Marcar como completada
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Pendientes ──────────────────────────────────────────────────────────

function PendingTab({ businessId }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    appointmentsApi
      .list(businessId, { status: 'requested' })
      .then(setAppointments)
      .catch(() => setError('Error cargando citas'))
      .finally(() => setLoading(false))
  }, [businessId])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (id) => {
    setActionLoading(`confirm-${id}`)
    try {
      await appointmentsApi.confirm(businessId, id)
      load()
    } catch { setError('Error confirmando cita') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (id) => {
    setActionLoading(`reject-${id}`)
    try {
      await appointmentsApi.reject(businessId, id)
      load()
    } catch { setError('Error rechazando cita') }
    finally { setActionLoading(null) }
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-3">
      {error && <ErrorBanner msg={error} onClose={() => setError('')} />}
      {appointments.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Sin citas pendientes"
          description="Las nuevas solicitudes de tus clientes aparecerán aquí"
        />
      ) : (
        appointments.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appt={appt}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onComplete={() => {}}
            loading={actionLoading}
          />
        ))
      )}
    </div>
  )
}

// ─── Tab: Todas las citas ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '',          label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'rejected',  label: 'Rechazadas' },
]

function AllAppointmentsTab({ businessId }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    appointmentsApi
      .list(businessId, params)
      .then(setAppointments)
      .catch(() => setError('Error cargando citas'))
      .finally(() => setLoading(false))
  }, [businessId, statusFilter])

  useEffect(() => { load() }, [load])

  const handleComplete = async (id) => {
    setActionLoading(`complete-${id}`)
    try {
      await appointmentsApi.complete(businessId, id)
      load()
    } catch { setError('Error completando cita') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-3">
      {/* Filtros de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ErrorBanner msg={error} onClose={() => setError('')} />}

      {loading ? (
        <LoadingState />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin citas"
          description="Aún no hay citas en esta categoría"
        />
      ) : (
        appointments.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appt={appt}
            onConfirm={() => {}}
            onReject={() => {}}
            onComplete={handleComplete}
            loading={actionLoading}
          />
        ))
      )}
    </div>
  )
}

// ─── Tab: Horario ─────────────────────────────────────────────────────────────

const WEEK_DAYS = [
  { key: 'monday',    label: 'Lunes' },
  { key: 'tuesday',   label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday',  label: 'Jueves' },
  { key: 'friday',    label: 'Viernes' },
  { key: 'saturday',  label: 'Sábado' },
  { key: 'sunday',    label: 'Domingo' },
]

const DEFAULT_SLOTS = {
  monday:    ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  tuesday:   ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  thursday:  ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  friday:    ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  saturday:  ['09:00', '10:00', '11:00'],
}

function ScheduleTab({ businessId }) {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [mode, setMode] = useState('time_slots')
  const [slotDuration, setSlotDuration] = useState(60)
  const [maxDays, setMaxDays] = useState(14)
  const [isActive, setIsActive] = useState(true)
  const [scheduleData, setScheduleData] = useState(DEFAULT_SLOTS)
  const [jsonError, setJsonError] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [jsonMode, setJsonMode] = useState(false)

  useEffect(() => {
    scheduleApi
      .get(businessId)
      .then((s) => {
        setSchedule(s)
        setMode(s.mode)
        setSlotDuration(s.slot_duration_minutes)
        setMaxDays(s.max_days_ahead)
        setIsActive(s.is_active)
        setScheduleData(s.schedule_data)
        setJsonText(JSON.stringify(s.schedule_data, null, 2))
      })
      .catch((e) => {
        if (e?.response?.status !== 404) setError('Error cargando horario')
        setJsonText(JSON.stringify(DEFAULT_SLOTS, null, 2))
      })
      .finally(() => setLoading(false))
  }, [businessId])

  const handleSave = async () => {
    let finalData = scheduleData
    if (jsonMode) {
      try {
        finalData = JSON.parse(jsonText)
        setJsonError('')
      } catch {
        setJsonError('JSON inválido — revisa la sintaxis')
        return
      }
    }

    setSaving(true)
    try {
      const saved = await scheduleApi.upsert(businessId, {
        mode,
        schedule_data: finalData,
        slot_duration_minutes: slotDuration,
        max_days_ahead: maxDays,
        is_active: isActive,
      })
      setSchedule(saved)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Error guardando horario')
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day) => {
    setScheduleData((prev) => {
      const next = { ...prev }
      if (next[day]) {
        delete next[day]
      } else {
        next[day] = mode === 'time_slots'
          ? ['09:00', '10:00', '11:00']
          : { morning: 3, afternoon: 2 }
      }
      return next
    })
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-5">
      {error && <ErrorBanner msg={error} onClose={() => setError('')} />}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          ✅ Horario guardado correctamente
        </div>
      )}

      {/* Modo */}
      <div className="card p-4 space-y-3">
        <p className="font-semibold text-text">Modo de agendamiento</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'time_slots', label: 'Horarios exactos', desc: 'Ej: barbería, salón' },
            { value: 'capacity',   label: 'Turnos por franja', desc: 'Ej: mecánica, lavado' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                mode === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface'
              }`}
            >
              <p className={`text-sm font-medium ${mode === opt.value ? 'text-primary' : 'text-text'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuración general */}
      <div className="card p-4 space-y-4">
        <p className="font-semibold text-text">Configuración</p>

        <div className="space-y-1">
          <label className="text-sm text-text-muted">Duración del turno (minutos)</label>
          <input
            type="number"
            min={15}
            max={480}
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="input-base w-full"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-text-muted">Días disponibles hacia adelante</label>
          <input
            type="number"
            min={1}
            max={60}
            value={maxDays}
            onChange={(e) => setMaxDays(Number(e.target.value))}
            className="input-base w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Chatbot activo</p>
            <p className="text-xs text-text-muted">Los clientes pueden agendar por WhatsApp</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Días y horarios */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-text">Días disponibles</p>
          <button
            onClick={() => setJsonMode(!jsonMode)}
            className="text-xs text-primary underline"
          >
            {jsonMode ? 'Vista simple' : 'Editar JSON'}
          </button>
        </div>

        {jsonMode ? (
          <div className="space-y-2">
            <textarea
              className="input-base w-full font-mono text-xs"
              rows={14}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
            {jsonError && <p className="text-xs text-danger">{jsonError}</p>}
            <p className="text-xs text-text-muted">
              {mode === 'time_slots'
                ? 'Formato: {"monday": ["09:00","10:00"], ...}'
                : 'Formato: {"monday": {"morning":3,"afternoon":2}, ...}'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {WEEK_DAYS.map(({ key, label }) => {
              const active = Boolean(scheduleData[key])
              const slots = scheduleData[key]
              return (
                <div
                  key={key}
                  className={`rounded-xl border p-3 transition-colors ${active ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${active ? 'text-primary' : 'text-text-muted'}`}>
                      {label}
                    </p>
                    <button
                      onClick={() => toggleDay(key)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </div>
                  {active && mode === 'time_slots' && Array.isArray(slots) && (
                    <p className="text-xs text-text-muted mt-1">
                      {slots.join(' · ')}
                    </p>
                  )}
                  {active && mode === 'capacity' && typeof slots === 'object' && !Array.isArray(slots) && (
                    <p className="text-xs text-text-muted mt-1">
                      {Object.entries(slots).map(([k, v]) => `${SHIFT_LABEL[k] || k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Button
        variant="primary"
        className="w-full"
        loading={saving}
        onClick={handleSave}
      >
        Guardar horario
      </Button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4 animate-pulse space-y-2">
          <div className="h-4 bg-surface-alt rounded w-1/2" />
          <div className="h-3 bg-surface-alt rounded w-1/3" />
          <div className="h-3 bg-surface-alt rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="font-semibold text-text mb-1">{title}</p>
      <p className="text-sm text-text-muted max-w-xs">{description}</p>
    </div>
  )
}

function ErrorBanner({ msg, onClose }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
      {msg}
      <button onClick={onClose} className="ml-2 text-red-500 font-bold">✕</button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

const TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'all',     label: 'Todas' },
  { key: 'schedule', label: 'Horario' },
]

export default function AppointmentsPage() {
  const { business } = useAppStore()
  const [activeTab, setActiveTab] = useState('pending')

  return (
    <div>
      <Header title="Citas" onBack={false} />

      {/* Tabs */}
      <div className="flex gap-1 px-5 pb-3 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'text-text-muted bg-surface-alt'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="px-5 pt-4 pb-28">
        {business?.id && (
          <>
            {activeTab === 'pending'  && <PendingTab businessId={business.id} />}
            {activeTab === 'all'      && <AllAppointmentsTab businessId={business.id} />}
            {activeTab === 'schedule' && <ScheduleTab businessId={business.id} />}
          </>
        )}
      </div>
    </div>
  )
}
