import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { clientsApi, serviceLogsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import Header from '../components/layout/Header'
import { clientLabel, initials, daysSince, formatDate, isUpcomingBirthday } from '../utils/format'

// ─── Badge de estado ────────────────────────────────────────────────────
const STATUS_VARIANT = { active: 'success', inactive: 'muted', optout: 'danger' }
const STATUS_LABEL   = { active: 'Activo', inactive: 'Inactivo', optout: 'Opt-out' }

// ─── Avatar ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' }
  return (
    <div className={`${sizes[size]} rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center flex-shrink-0`}>
      {initials(name)}
    </div>
  )
}

// ─── Lista de clientes ───────────────────────────────────────────────────
function ClientsList() {
  const navigate = useNavigate()
  const { business, clients, setClients } = useAppStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    clientsApi.list(business.id).then(setClients).finally(() => setLoading(false))
  }, [business?.id])

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && c.status === 'active') ||
      (filter === 'inactive' && c.status === 'inactive') ||
      (filter === 'atrisk' && daysSince(c.updated_at) > 60)
    return matchSearch && matchFilter
  })

  return (
    <div>
      <Header
        title="Clientes"
        onBack={false}
        rightAction={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/clients/bulk')}
              title="Carga masiva"
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/clients/new')}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="px-5 pb-4 space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-base pl-10"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all',      label: 'Todos' },
            { key: 'active',   label: 'Activos' },
            { key: 'inactive', label: 'Inactivos' },
            { key: 'atrisk',   label: 'En riesgo' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-card text-text-muted border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center text-text-muted text-sm py-8">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-text-muted text-sm">
              {search ? 'Sin resultados' : 'Aún no tienes clientes'}
            </p>
            {!search && (
              <button onClick={() => navigate('/clients/new')} className="text-primary text-sm font-medium mt-2">
                + Agregar primer cliente
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((client) => {
              const dias = daysSince(client.updated_at)
              const hasBirthday = isUpcomingBirthday(client.birth_date, 7)
              return (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="w-full card flex items-center gap-3 text-left active:opacity-75 transition-opacity"
                >
                  <Avatar name={client.display_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text text-sm truncate">{client.display_name}</span>
                      <Badge variant={STATUS_VARIANT[client.status]}>{STATUS_LABEL[client.status]}</Badge>
                      {hasBirthday && (
                        <span className="text-lg">🎂</span>
                      )}
                    </div>
                    {client.full_name && (
                      <p className="text-text-muted text-xs truncate">{client.full_name}</p>
                    )}
                    <p className="text-text-subtle text-xs">{client.phone}</p>
                  </div>
                  {dias > 60 && (
                    <Badge variant="warning">{dias}d</Badge>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/clients/new')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:bg-primary-dark"
        style={{ maxWidth: 'calc(430px - 1rem)', marginLeft: 'auto' }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// ─── Nuevo cliente ───────────────────────────────────────────────────────
// ─── Utilidades de teléfono ──────────────────────────────────────────────────
const COUNTRY_FLAGS = [
  { prefix: '57',  flag: '🇨🇴', name: 'Colombia' },
  { prefix: '52',  flag: '🇲🇽', name: 'México' },
  { prefix: '54',  flag: '🇦🇷', name: 'Argentina' },
  { prefix: '55',  flag: '🇧🇷', name: 'Brasil' },
  { prefix: '56',  flag: '🇨🇱', name: 'Chile' },
  { prefix: '51',  flag: '🇵🇪', name: 'Perú' },
  { prefix: '58',  flag: '🇻🇪', name: 'Venezuela' },
  { prefix: '593', flag: '🇪🇨', name: 'Ecuador' },
  { prefix: '595', flag: '🇵🇾', name: 'Paraguay' },
  { prefix: '598', flag: '🇺🇾', name: 'Uruguay' },
  { prefix: '503', flag: '🇸🇻', name: 'El Salvador' },
  { prefix: '504', flag: '🇭🇳', name: 'Honduras' },
  { prefix: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { prefix: '507', flag: '🇵🇦', name: 'Panamá' },
  { prefix: '1',   flag: '🇺🇸', name: 'USA/Canadá' },
]

function getCountryFromPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  for (const c of COUNTRY_FLAGS) {
    if (digits.startsWith(c.prefix)) return c
  }
  return null
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7) return 'El teléfono debe tener al menos 7 dígitos'
  if (digits.length > 15) return 'El teléfono es demasiado largo'
  return null
}

function validateEmail(email) {
  if (!email) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email) ? null : 'Correo electrónico inválido'
}

function NewClient() {
  const navigate = useNavigate()
  const { business, addClient } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState({})
  const [form, setForm] = useState({
    display_name: '',
    full_name: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: '',
    preferred_channel: 'whatsapp',
    notes: '',
  })

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))
  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }))

  const phoneError   = touched.phone ? validatePhone(form.phone) : null
  const emailError   = touched.email ? validateEmail(form.email) : null
  const countryInfo  = form.phone ? getCountryFromPhone(form.phone) : null
  const canSubmit    = form.display_name.trim() && form.phone.trim() && !phoneError && !emailError

  const handleSubmit = async () => {
    setTouched({ phone: true, email: true })
    const pErr = validatePhone(form.phone)
    const eErr = validateEmail(form.email)
    if (pErr || eErr || !form.display_name.trim()) return

    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        email: form.email || null,
        full_name: form.full_name || null,
        notes: form.notes || null,
      }
      const client = await clientsApi.create(business.id, payload)
      addClient(client)
      navigate('/clients')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header title="Nuevo cliente" />
      <div className="px-5 pb-6 space-y-0">
        <Input label="Apodo *" placeholder="Ivancho, Carlitos..." value={form.display_name} onChange={(e) => set('display_name', e.target.value)} />
        <Input label="Nombre completo" placeholder="Ivan Argemiro Rios" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />

        {/* Teléfono con bandera */}
        <div className="mb-4">
          <label className="block text-sm text-text-muted mb-1">Teléfono WhatsApp *</label>
          <div className="relative">
            {countryInfo && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg select-none" title={countryInfo.name}>
                {countryInfo.flag}
              </span>
            )}
            <input
              type="tel"
              placeholder="+57 300 123 4567"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              onBlur={() => touch('phone')}
              className={`input-base w-full ${countryInfo ? 'pl-10' : ''} ${phoneError ? 'border-danger' : ''}`}
            />
          </div>
          {phoneError && <p className="text-danger text-xs mt-1">{phoneError}</p>}
          {countryInfo && !phoneError && (
            <p className="text-text-muted text-xs mt-1">{countryInfo.flag} {countryInfo.name}</p>
          )}
        </div>

        {/* Email con validación */}
        <div className="mb-4">
          <label className="block text-sm text-text-muted mb-1">Correo electrónico</label>
          <input
            type="email"
            placeholder="cliente@email.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => touch('email')}
            className={`input-base w-full ${emailError ? 'border-danger' : ''}`}
          />
          {emailError && <p className="text-danger text-xs mt-1">{emailError}</p>}
        </div>

        {/* Fecha nacimiento + sexo */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input label="Fecha de nacimiento" type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
          </div>
          <div className="flex-1">
            <Select
              label="Sexo"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              options={[
                { value: '', label: 'No especificar' },
                { value: 'male', label: 'Hombre' },
                { value: 'female', label: 'Mujer' },
                { value: 'other', label: 'Otro' },
              ]}
            />
          </div>
        </div>

        <Select
          label="Canal preferido"
          value={form.preferred_channel}
          onChange={(e) => set('preferred_channel', e.target.value)}
          options={[
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'email', label: 'Correo electrónico' },
          ]}
        />

        <Textarea label="Notas" placeholder="Info adicional sobre el cliente..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm mb-4">
            {error}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Guardando...' : 'Guardar cliente'}
        </Button>
      </div>
    </div>
  )
}

// ─── Detalle del cliente ─────────────────────────────────────────────────
function ClientDetail() {
  const navigate = useNavigate()
  const { business, clients } = useAppStore()
  const id = window.location.pathname.split('/').pop()
  const client = clients.find((c) => c.id === id)
  const [serviceLogs, setServiceLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState(null)

  useEffect(() => {
    if (!business?.id || !id) return
    serviceLogsApi.list(business.id, { client_id: id })
      .then(setServiceLogs)
      .catch(() => setServiceLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [business?.id, id])

  if (!client) {
    return (
      <div>
        <Header title="Cliente" />
        <div className="p-5 text-center text-text-muted text-sm">Cliente no encontrado</div>
      </div>
    )
  }

  const GENDER_LABEL = { male: 'Hombre', female: 'Mujer', other: 'Otro' }
  const PAYMENT_LABEL = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro' }

  const isBirthday =
    client.birth_date &&
    new Date(client.birth_date).toLocaleDateString('es-CO', { month: '2-digit', day: '2-digit' }) ===
      new Date().toLocaleDateString('es-CO', { month: '2-digit', day: '2-digit' })

  // ── Estadísticas calculadas ──────────────────────────────────────────
  const totalVisits   = serviceLogs.length
  const totalSpent    = serviceLogs.reduce((s, l) => s + (l.price_charged || 0), 0)
  const ratedLogs     = serviceLogs.filter((l) => l.rating !== null)
  const goodRatings   = ratedLogs.filter((l) => l.rating >= 3).length
  const satisfPct     = ratedLogs.length > 0 ? Math.round((goodRatings / ratedLogs.length) * 100) : null
  const lastLog       = serviceLogs[0]
  const daysSinceLast = lastLog ? daysSince(lastLog.completed_at) : null

  const formatCOP = (n) =>
    n ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) : '—'

  return (
    <div>
      <Header title="Detalle cliente" />
      <div className="px-5 pb-6 space-y-4">

        {/* Cabecera */}
        <div className="flex items-center gap-4">
          <Avatar name={client.display_name} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-text">{client.display_name}</h2>
            {client.full_name && <p className="text-text-muted text-sm">{client.full_name}</p>}
            <Badge variant={STATUS_VARIANT[client.status]}>{STATUS_LABEL[client.status]}</Badge>
          </div>
        </div>

        {/* Alerta cumpleaños */}
        {isBirthday && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex items-center gap-2 text-warning text-sm">
            🎂 <span>¡Hoy es el cumpleaños de {client.display_name}!</span>
          </div>
        )}

        {/* Estadísticas clave */}
        {!loadingLogs && totalVisits > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary">{totalVisits}</p>
              <p className="text-text-muted text-xs mt-0.5">Visitas totales</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-success">{formatCOP(totalSpent)}</p>
              <p className="text-text-muted text-xs mt-0.5">Total gastado</p>
            </div>
            <div className="card text-center">
              {satisfPct !== null ? (
                <>
                  <p className={`text-2xl font-bold ${satisfPct >= 70 ? 'text-success' : 'text-danger'}`}>{satisfPct}%</p>
                  <p className="text-text-muted text-xs mt-0.5">Satisfacción ({ratedLogs.length} enc.)</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-text-muted">—</p>
                  <p className="text-text-muted text-xs mt-0.5">Sin encuestas</p>
                </>
              )}
            </div>
            <div className="card text-center">
              {daysSinceLast !== null ? (
                <>
                  <p className={`text-2xl font-bold ${daysSinceLast > 60 ? 'text-warning' : 'text-text'}`}>
                    {daysSinceLast === 0 ? 'Hoy' : `${daysSinceLast}d`}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">Última visita</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-text-muted">—</p>
                  <p className="text-text-muted text-xs mt-0.5">Última visita</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Info de contacto */}
        <div className="card space-y-2.5">
          {[
            { icon: '📱', label: 'Teléfono', value: client.phone },
            { icon: '📧', label: 'Email', value: client.email },
            { icon: '🎂', label: 'Nacimiento', value: client.birth_date ? formatDate(client.birth_date) : null },
            { icon: '👤', label: 'Sexo', value: client.gender ? GENDER_LABEL[client.gender] : null },
          ]
            .filter((r) => r.value)
            .map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-lg">{row.icon}</span>
                <div>
                  <p className="text-text-muted text-xs">{row.label}</p>
                  <p className="text-text text-sm">{row.value}</p>
                </div>
              </div>
            ))}
        </div>

        {/* Notas del cliente */}
        {client.notes && (
          <div className="card">
            <p className="text-text-muted text-xs mb-1">📝 Notas del cliente</p>
            <p className="text-text text-sm">{client.notes}</p>
          </div>
        )}

        {/* Historial de servicios */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text text-sm">Historial de servicios</h3>
            <button
              onClick={() => navigate('/services/complete')}
              className="text-primary text-xs font-medium"
            >
              + Registrar
            </button>
          </div>

          {loadingLogs ? (
            <div className="text-text-muted text-xs text-center py-3">Cargando...</div>
          ) : serviceLogs.length === 0 ? (
            <div className="card text-center py-4">
              <p className="text-text-muted text-xs">Sin servicios registrados aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {serviceLogs.map((log) => {
                const isOpen = expandedLogId === log.id
                const ratingBadge = log.rating !== null
                  ? <Badge variant={log.rating >= 3 ? 'success' : 'danger'}>{log.rating >= 3 ? '⭐ Satisfecho' : '😟 Insatisfecho'}</Badge>
                  : log.follow_up_sent
                    ? <Badge variant="warning">💬 Esperando</Badge>
                    : <Badge variant="muted">📩 Pendiente</Badge>

                return (
                  <div key={log.id} className="card p-0 overflow-hidden">
                    {/* Cabecera de la tarjeta */}
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                    >
                      <div>
                        <p className="text-text text-sm font-medium">{log.service_name || 'Servicio'}</p>
                        <p className="text-text-muted text-xs">{formatDate(log.completed_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ratingBadge}
                        <span className="text-text-muted text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {/* Panel expandido */}
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-2.5">
                        {/* Precio y pago */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-surface rounded-lg px-3 py-2">
                            <p className="text-text-muted text-xs">Precio cobrado</p>
                            <p className="text-text text-sm font-semibold">{log.price_charged ? formatCOP(log.price_charged) : '—'}</p>
                          </div>
                          <div className="bg-surface rounded-lg px-3 py-2">
                            <p className="text-text-muted text-xs">Pago</p>
                            <p className="text-text text-sm font-semibold">{log.payment_method ? (PAYMENT_LABEL[log.payment_method] || log.payment_method) : '—'}</p>
                          </div>
                        </div>

                        {/* Fecha exacta */}
                        <div className="bg-surface rounded-lg px-3 py-2">
                          <p className="text-text-muted text-xs">Fecha y hora</p>
                          <p className="text-text text-sm">
                            {new Date(log.completed_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>

                        {/* Notas del servicio */}
                        {log.service_notes && (
                          <div className="bg-surface rounded-lg px-3 py-2">
                            <p className="text-text-muted text-xs mb-0.5">Notas del servicio</p>
                            <p className="text-text text-sm">{log.service_notes}</p>
                          </div>
                        )}

                        {/* Notas generales */}
                        {log.notes && (
                          <div className="bg-surface rounded-lg px-3 py-2">
                            <p className="text-text-muted text-xs mb-0.5">Notas generales</p>
                            <p className="text-text text-sm">{log.notes}</p>
                          </div>
                        )}

                        {/* Comprobante y calificación */}
                        <div className="flex gap-2 flex-wrap">
                          {log.summary_sent && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">✅ Comprobante enviado</span>
                          )}
                          {log.rating !== null && (
                            <span className={`text-xs px-2 py-1 rounded-lg ${log.rating >= 3 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              {log.rating >= 3 ? '⭐ Calificó positivo' : '😟 Calificó negativo'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Acciones */}
        <Button onClick={() => navigate('/reminders/new', { state: { clientId: client.id } })}>
          + Crear recordatorio
        </Button>
      </div>
    </div>
  )
}

// ─── Carga masiva ────────────────────────────────────────────────────────
function BulkUpload() {
  const navigate = useNavigate()
  const { business, setClients } = useAppStore()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file || !business?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await clientsApi.bulkUpload(business.id, file)
      setResult(res)
      // Recargar lista de clientes
      clientsApi.list(business.id).then(setClients)
    } catch (err) {
      setError(err.message || 'Error al cargar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'nombre,telefono,email,notas\nJuan Pérez,3001234567,juan@email.com,Cliente frecuente\nMaría García,3109876543,,\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_clientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Header title="Carga masiva" onBack={() => navigate('/clients')} />
      <div className="px-5 pb-6 space-y-4">
        {/* Info template */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-text text-sm font-medium mb-1">Formato del archivo CSV</p>
          <p className="text-text-muted text-xs">Columnas requeridas: <strong>nombre</strong>, <strong>telefono</strong></p>
          <p className="text-text-muted text-xs">Columnas opcionales: email, notas</p>
          <p className="text-text-muted text-xs mt-1">Los teléfonos colombianos de 10 dígitos se normalizan automáticamente.</p>
          <button
            onClick={downloadTemplate}
            className="mt-2 text-primary text-xs font-medium underline"
          >
            Descargar plantilla de ejemplo
          </button>
        </div>

        {/* Drop zone */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('csv-input').click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div className="text-3xl mb-2">📄</div>
                <p className="text-text font-medium text-sm">{file.name}</p>
                <p className="text-text-muted text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Listo para cargar</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">📂</div>
                <p className="text-text font-medium text-sm">Arrastra tu CSV aquí</p>
                <p className="text-text-muted text-xs mt-1">o toca para seleccionar</p>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <p className="text-2xl font-bold text-success">{result.created}</p>
                <p className="text-text-muted text-xs">Creados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-warning">{result.skipped}</p>
                <p className="text-text-muted text-xs">Duplicados</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-danger">{result.errors_count}</p>
                <p className="text-text-muted text-xs">Errores</p>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="card">
                <p className="text-text font-medium text-sm mb-2">Errores detectados</p>
                <div className="space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-danger text-xs">Fila {e.row}: {e.reason} {e.data ? `(${e.data})` : ''}</p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => navigate('/clients')}>
              Ver clientes
            </Button>
            <button
              onClick={() => { setFile(null); setResult(null) }}
              className="w-full text-text-muted text-sm py-2"
            >
              Cargar otro archivo
            </button>
          </div>
        )}

        {file && !result && (
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? 'Cargando...' : `Importar clientes`}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Router de clientes ──────────────────────────────────────────────────
export default function ClientsPage() {
  return (
    <Routes>
      <Route index element={<ClientsList />} />
      <Route path="new" element={<NewClient />} />
      <Route path="bulk" element={<BulkUpload />} />
      <Route path=":id" element={<ClientDetail />} />
    </Routes>
  )
}
