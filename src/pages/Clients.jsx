import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { clientsApi, serviceLogsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import Header from '../components/layout/Header'
import { clientLabel, initials, daysSince, formatDate } from '../utils/format'

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
          <button
            onClick={() => navigate('/clients/new')}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
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
function NewClient() {
  const navigate = useNavigate()
  const { business, addClient } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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

  const handleSubmit = async () => {
    if (!form.display_name.trim() || !form.phone.trim()) return
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
        <Input label="Teléfono WhatsApp *" placeholder="+57 300 123 4567" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Correo electrónico" placeholder="cliente@email.com" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />

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

        <Button onClick={handleSubmit} disabled={!form.display_name.trim() || !form.phone.trim() || loading}>
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
  const dias = daysSince(client.updated_at)
  const isBirthday =
    client.birth_date &&
    new Date(client.birth_date).toLocaleDateString('es-CO', { month: '2-digit', day: '2-digit' }) ===
      new Date().toLocaleDateString('es-CO', { month: '2-digit', day: '2-digit' })

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

        {/* Info básica */}
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

        {/* Notas */}
        {client.notes && (
          <div className="card">
            <p className="text-text-muted text-xs mb-1">Notas</p>
            <p className="text-text text-sm">{client.notes}</p>
          </div>
        )}

        {/* Última visita */}
        {dias !== null && (
          <div className="card flex items-center justify-between">
            <span className="text-text-muted text-sm">Última actividad</span>
            <Badge variant={dias > 60 ? 'warning' : 'success'}>{dias === 0 ? 'Hoy' : `hace ${dias} días`}</Badge>
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
            <div className="card text-center py-3">
              <p className="text-text-muted text-xs">Sin servicios registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {serviceLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="card flex items-center justify-between">
                  <div>
                    <p className="text-text text-sm font-medium">{log.service_name || 'Servicio'}</p>
                    <p className="text-text-muted text-xs">{formatDate(log.completed_at)}</p>
                  </div>
                  {log.rating !== null ? (
                    <Badge variant={log.rating >= 3 ? 'success' : 'danger'}>
                      {log.rating >= 3 ? 'Satisfecho' : 'Insatisfecho'}
                    </Badge>
                  ) : log.follow_up_sent ? (
                    <Badge variant="warning">Esperando</Badge>
                  ) : (
                    <Badge variant="muted">Pendiente</Badge>
                  )}
                </div>
              ))}
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

// ─── Router de clientes ──────────────────────────────────────────────────
export default function ClientsPage() {
  return (
    <Routes>
      <Route index element={<ClientsList />} />
      <Route path="new" element={<NewClient />} />
      <Route path=":id" element={<ClientDetail />} />
    </Routes>
  )
}
