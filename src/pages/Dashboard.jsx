import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsApi, remindersApi, notificationsApi, appointmentsApi, reportsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { daysSince, formatDate } from '../utils/format'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n == null ? '$0' : `$${Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`

const SHIFT_LABEL = { morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche' }
const APPT_STATUS_COLOR = {
  requested: '#f59e0b',
  confirmed: '#10b981',
  completed: '#64748b',
  rejected: '#ef4444',
  cancelled: '#ef4444',
}
const APPT_STATUS_LABEL = {
  requested: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
}

// ─── Hero Revenue Card ─────────────────────────────────────────────────────────

function RevenueHero({ revenue, growth, period, loading }) {
  const isUp = growth >= 0
  const periodLabel = { today: 'hoy', week: 'esta semana', month: 'este mes', year: 'este año' }[period] || 'este período'

  return (
    <div
      className="mx-5 mb-1 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%)',
        borderRadius: 20,
        padding: '20px 20px 18px',
      }}
    >
      {/* Círculos decorativos */}
      <div style={{
        position: 'absolute', top: -30, right: -20,
        width: 110, height: 110,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -25, right: 40,
        width: 70, height: 70,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />

      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, position: 'relative' }}>
        💰 Ingresos {periodLabel}
      </p>

      {loading ? (
        <div style={{ height: 38, width: '55%', background: 'rgba(255,255,255,0.15)', borderRadius: 8, marginBottom: 8 }} />
      ) : (
        <p style={{
          fontSize: 34,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-1px',
          marginBottom: 6,
          lineHeight: 1.1,
          position: 'relative',
        }}>
          {fmt(revenue)}
        </p>
      )}

      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: isUp ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
            color: isUp ? '#6ee7b7' : '#fca5a5',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {isUp ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            vs. período anterior
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────

function MiniStat({ icon, label, value, color = '#6366f1', loading, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card flex-1 min-w-0 text-left active:opacity-75"
      style={{ padding: '12px 14px' }}
    >
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      {loading ? (
        <div style={{ height: 24, width: '60%', background: 'rgba(255,255,255,0.07)', borderRadius: 6, marginBottom: 4 }} />
      ) : (
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      )}
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </button>
  )
}

// ─── Appointment row ──────────────────────────────────────────────────────────

function ApptRow({ appt, onClick }) {
  const time = appt.appointment_time
    ? String(appt.appointment_time).slice(0, 5)
    : SHIFT_LABEL[appt.shift] || '—'
  const color = APPT_STATUS_COLOR[appt.status] || '#64748b'
  const label = APPT_STATUS_LABEL[appt.status] || appt.status

  return (
    <button
      onClick={onClick}
      className="w-full active:opacity-75"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#1e2235', borderRadius: 14,
        padding: '10px 14px', border: '1px solid #2d3148',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>📅</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {appt.client_name || 'Cliente'}
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          {appt.service_name || '—'} · {time}
        </p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, color,
        background: `${color}22`, borderRadius: 999, padding: '2px 8px',
        flexShrink: 0,
      }}>{label}</span>
    </button>
  )
}

// ─── Quick action button ──────────────────────────────────────────────────────

function QuickAction({ icon, label, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="active:opacity-75"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        background: '#1e2235', borderRadius: 16, padding: '16px 8px',
        border: '1px solid #2d3148', flex: 1,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20,
        boxShadow: `0 4px 14px ${bg}66`,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { business, clients, setClients } = useAppStore()
  const [reminders, setReminders] = useState([])
  const [todayAppts, setTodayAppts] = useState([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [revenue, setRevenue] = useState(null)
  const [growth, setGrowth] = useState(0)
  const [period] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      clientsApi.list(business.id),
      remindersApi.list(business.id, { upcoming_days: 7 }),
      notificationsApi.unreadCount(business.id),
      appointmentsApi.list(business.id, { from_date: today, to_date: today }).catch(() => []),
      reportsApi.income(business.id, { period }).catch(() => null),
    ]).then(([c, r, notifs, appts, rep]) => {
      setClients(c)
      setReminders(r)
      setUnreadNotifications(notifs.count)
      setTodayAppts(Array.isArray(appts) ? appts : [])
      if (rep) {
        setRevenue(rep.total_revenue)
        setGrowth(rep.growth_pct ?? 0)
      }
    }).finally(() => setLoading(false))
  }, [business?.id])

  const atRisk = clients.filter((c) => daysSince(c.updated_at) > 60 && c.status === 'active')
  const activeClients = clients.filter((c) => c.status === 'active').length
  const upcomingCount = reminders.filter((r) => r.status === 'active').length

  return (
    <div style={{ paddingBottom: 90 }}>

      {/* ── Header ── */}
      <div style={{
        padding: '20px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Bienvenido de nuevo</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: 0, letterSpacing: '-0.5px' }}>
            {business?.name || '…'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/notifications')}
            style={{
              position: 'relative', width: 38, height: 38,
              borderRadius: 999, background: '#1e2235',
              border: '1px solid #2d3148',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer',
            }}
          >
            🔔
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                width: 18, height: 18, borderRadius: '50%',
                background: '#ef4444', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: 38, height: 38, borderRadius: 999,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontWeight: 800, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}
          >
            {(business?.name || 'R')[0].toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Revenue hero ── */}
      <RevenueHero revenue={revenue} growth={growth} period={period} loading={loading} />

      {/* ── Mini stats ── */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 20px' }}>
        <MiniStat
          icon="👥" label="Clientes activos"
          value={loading ? '—' : activeClients}
          color="#6366f1" loading={loading}
          onClick={() => navigate('/clients')}
        />
        <MiniStat
          icon="📅" label="Citas hoy"
          value={loading ? '—' : todayAppts.length}
          color="#10b981" loading={loading}
          onClick={() => navigate('/appointments')}
        />
        <MiniStat
          icon="⚠️" label="En riesgo"
          value={loading ? '—' : atRisk.length}
          color={atRisk.length > 0 ? '#ef4444' : '#64748b'} loading={loading}
          onClick={() => navigate('/clients')}
        />
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Citas de hoy ── */}
        {(loading || todayAppts.length > 0) && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Citas de hoy</h2>
              <button onClick={() => navigate('/appointments')} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Ver todas →
              </button>
            </div>
            {loading ? (
              <div style={{ height: 56, background: '#1e2235', borderRadius: 14, opacity: 0.5 }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayAppts.slice(0, 4).map((appt) => (
                  <ApptRow key={appt.id} appt={appt} onClick={() => navigate('/appointments')} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Clientes en riesgo ── */}
        {atRisk.length > 0 && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>⚠️ Clientes en riesgo</h2>
              <button onClick={() => navigate('/clients')} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Ver todos →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atRisk.slice(0, 3).map((c) => {
                const dias = daysSince(c.updated_at)
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="active:opacity-75"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: '#1e2235', borderRadius: 14,
                      padding: '10px 14px', border: '1px solid rgba(239,68,68,0.2)',
                      textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(239,68,68,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 700, color: '#ef4444',
                    }}>
                      {c.display_name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.display_name}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Sin visita hace {dias} días
                      </p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#ef4444',
                      background: 'rgba(239,68,68,0.12)', borderRadius: 999,
                      padding: '2px 8px', flexShrink: 0,
                    }}>{dias}d</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Próximos recordatorios ── */}
        {(loading || reminders.length > 0) && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>🔔 Recordatorios activos</h2>
              <button onClick={() => navigate('/notifications')} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Ver todos →
              </button>
            </div>
            {loading ? (
              <div style={{ height: 56, background: '#1e2235', borderRadius: 14, opacity: 0.5 }} />
            ) : reminders.length === 0 ? (
              <div style={{
                background: '#1e2235', borderRadius: 16, padding: '18px',
                textAlign: 'center', border: '1px solid #2d3148',
              }}>
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Sin recordatorios próximos</p>
                <button
                  onClick={() => navigate('/reminders/new')}
                  style={{ color: '#6366f1', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                >
                  + Crear uno
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reminders.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: '#1e2235', borderRadius: 14,
                      padding: '10px 14px', border: '1px solid #2d3148',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(99,102,241,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>🔔</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clients.find((c) => c.id === r.client_id)?.display_name || 'Cliente'}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        {r.next_send_date ? formatDate(r.next_send_date) : '—'}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#10b981',
                      background: 'rgba(16,185,129,0.12)', borderRadius: 999,
                      padding: '2px 8px',
                    }}>Activo</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Accesos rápidos ── */}
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 10px' }}>Accesos rápidos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <QuickAction icon="👤" label="Nuevo cliente" color="#6366f1" bg="rgba(99,102,241,0.18)" onClick={() => navigate('/clients/new')} />
            <QuickAction icon="🔔" label="Recordatorio" color="#f59e0b" bg="rgba(245,158,11,0.18)" onClick={() => navigate('/reminders/new')} />
            <QuickAction icon="📊" label="Reportes" color="#10b981" bg="rgba(16,185,129,0.18)" onClick={() => navigate('/reports')} />
            <QuickAction icon="📅" label="Citas" color="#8b5cf6" bg="rgba(139,92,246,0.18)" onClick={() => navigate('/appointments')} />
          </div>
        </section>

      </div>
    </div>
  )
}
