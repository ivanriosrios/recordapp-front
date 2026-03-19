import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi, remindersApi, serviceLogsApi, clientsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { formatDate } from '../utils/format'

// ─── Tipo legible de notificación in-app ────────────────────────────────
const NOTIFICATION_META = {
  reminder_sent: { icon: '📤', label: 'Recordatorio enviado', color: '#6366f1' },
  reminder_failed: { icon: '❌', label: 'Error en recordatorio', color: '#ef4444' },
  client_responded: { icon: '💬', label: 'Respuesta de cliente', color: '#10b981' },
  client_optout: { icon: '🚫', label: 'Cliente se dio de baja', color: '#ef4444' },
  follow_up_rated: { icon: '⭐', label: 'Encuesta respondida', color: '#f59e0b' },
  birthday_sent: { icon: '🎂', label: 'Cumpleaños enviado', color: '#ec4899' },
  reactivation_sent: { icon: '🔄', label: 'Reactivación enviada', color: '#8b5cf6' },
  booking_request: { icon: '📅', label: 'Solicitud de cita', color: '#06b6d4' },
  booking_started: { icon: '🗓️', label: 'Cita iniciada', color: '#06b6d4' },
  appointment_requested: { icon: '📲', label: 'Cita por WhatsApp', color: '#06b6d4' },
}

// ─── Tipo legible de recordatorio ───────────────────────────────────────
const REMINDER_TYPE_LABEL = {
  recurring: 'Recurrente',
  one_time: 'Una vez',
}

function RelativeTime({ date }) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return d.toLocaleDateString('es-ES')
}

function FutureDate({ date }) {
  if (!date) return <span style={{ color: '#64748b', fontSize: 11 }}>Sin fecha</span>
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.ceil((d - now) / 86400000)
  const label = diffDays <= 0 ? 'Hoy' : diffDays === 1 ? 'Mañana' : `En ${diffDays} días`
  const color = diffDays <= 0 ? '#ef4444' : diffDays <= 2 ? '#f59e0b' : '#64748b'
  return (
    <span style={{ color, fontSize: 11, fontWeight: diffDays <= 1 ? 700 : 400 }}>
      📅 {label} · {d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
    </span>
  )
}

// ─── Tarjeta de recordatorio activo ─────────────────────────────────────
function ReminderCard({ reminder, clientName, onSendNow, onPause, onResume, loadingId }) {
  const isBusy = loadingId === reminder.id
  const isPaused = reminder.status === 'paused'

  return (
    <div style={{
      background: isPaused ? '#1e2235' : '#1a1d2e',
      border: `1px solid ${isPaused ? '#2d3148' : 'rgba(99,102,241,0.2)'}`,
      borderRadius: 14, padding: '12px 14px',
      opacity: isPaused ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {clientName || 'Cliente'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999,
              background: isPaused ? 'rgba(100,116,139,0.15)' : 'rgba(99,102,241,0.15)',
              color: isPaused ? '#64748b' : '#818cf8',
              flexShrink: 0,
            }}>
              {isPaused ? 'Pausado' : REMINDER_TYPE_LABEL[reminder.type] || reminder.type}
            </span>
          </div>
          <FutureDate date={reminder.next_send_date} />
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 6 }}>
        {!isPaused && (
          <button
            onClick={() => onSendNow(reminder.id)}
            disabled={isBusy}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.25)', cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            {isBusy ? '⏳ Enviando...' : '▶ Enviar ahora'}
          </button>
        )}
        {isPaused ? (
          <button
            onClick={() => onResume(reminder.id)}
            disabled={isBusy}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(16,185,129,0.1)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.2)', cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            ▶ Reactivar
          </button>
        ) : (
          <button
            onClick={() => onPause(reminder.id)}
            disabled={isBusy}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.2)', cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            ⏸ Pausar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta de follow-up pendiente ─────────────────────────────────────
function FollowUpCard({ log }) {
  const completedAt = new Date(log.completed_at)
  const sendAt = new Date(completedAt)
  sendAt.setDate(sendAt.getDate() + (log.follow_up_days ?? 2))
  return (
    <div style={{
      background: '#1a1d2e', border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: 14, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>📩</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            {log.client_name || 'Cliente'} — {log.service_name || 'Servicio'}
          </p>
          <FutureDate date={sendAt.toISOString()} />
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Encuesta post-servicio pendiente de envío</p>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate()
  const { business } = useAppStore()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [reminders, setReminders] = useState([])
  const [clientMap, setClientMap] = useState({})
  const [loadingReminders, setLoadingReminders] = useState(true)
  const [loadingId, setLoadingId] = useState(null)
  const [sendSuccess, setSendSuccess] = useState(null)

  const [pendingFollowUps, setPendingFollowUps] = useState([])

  const [activeTab, setActiveTab] = useState('alerts') // 'alerts' | 'scheduled'

  useEffect(() => {
    if (!business?.id) return
    loadNotifications()
    loadReminders()
    loadFollowUps()
  }, [business?.id])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const [notifs, unread] = await Promise.all([
        notificationsApi.list(business.id, { limit: 100 }),
        notificationsApi.unreadCount(business.id),
      ])
      setNotifications(notifs)
      setUnreadCount(unread.count)
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadReminders = async () => {
    try {
      setLoadingReminders(true)
      const [rems, clients] = await Promise.all([
        remindersApi.list(business.id, { limit: 100 }),
        clientsApi.list(business.id),
      ])
      const map = {}
      clients.forEach((c) => { map[c.id] = c.display_name })
      setClientMap(map)
      // Mostrar activos y pausados (no los done)
      setReminders(rems.filter((r) => r.status !== 'done'))
    } catch (err) {
      console.error('Error loading reminders:', err)
    } finally {
      setLoadingReminders(false)
    }
  }

  const loadFollowUps = async () => {
    try {
      const logs = await serviceLogsApi.list(business.id)
      // Follow-ups no enviados aún (encuesta programada)
      const pending = logs.filter((l) => !l.follow_up_sent && l.completed_at)
      setPendingFollowUps(pending)
    } catch (err) {
      console.error('Error loading follow-ups:', err)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markRead(business.id, id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead(business.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleSendNow = async (reminderId) => {
    setLoadingId(reminderId)
    try {
      await remindersApi.sendNow(business.id, reminderId)
      setSendSuccess(reminderId)
      setTimeout(() => setSendSuccess(null), 3000)
    } catch (err) {
      console.error('Error sending now:', err)
    } finally {
      setLoadingId(null)
    }
  }

  const handlePause = async (reminderId) => {
    setLoadingId(reminderId)
    try {
      await remindersApi.update(business.id, reminderId, { status: 'paused' })
      setReminders((prev) => prev.map((r) => r.id === reminderId ? { ...r, status: 'paused' } : r))
    } catch (err) {
      console.error('Error pausing:', err)
    } finally {
      setLoadingId(null)
    }
  }

  const handleResume = async (reminderId) => {
    setLoadingId(reminderId)
    try {
      await remindersApi.update(business.id, reminderId, { status: 'active' })
      setReminders((prev) => prev.map((r) => r.id === reminderId ? { ...r, status: 'active' } : r))
    } catch (err) {
      console.error('Error resuming:', err)
    } finally {
      setLoadingId(null)
    }
  }

  const activeReminders = reminders.filter((r) => r.status === 'active')
  const pausedReminders = reminders.filter((r) => r.status === 'paused')
  const scheduledCount = activeReminders.length + pendingFollowUps.length

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs">Avisos</p>
          <h1 className="text-lg font-bold text-text">
            {unreadCount > 0 ? (
              <>Tienes <span className="text-primary">{unreadCount}</span> sin leer</>
            ) : (
              'Notificaciones'
            )}
          </h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-full bg-border/30 text-text-muted font-bold text-sm flex items-center justify-center"
        >
          ←
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          display: 'flex', gap: 4,
          background: '#1e2235', borderRadius: 12, padding: 3,
          border: '1px solid #2d3148',
        }}>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9,
              fontSize: 13, fontWeight: 600,
              background: activeTab === 'alerts' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
              color: activeTab === 'alerts' ? '#fff' : '#64748b',
              border: 'none', cursor: 'pointer',
              boxShadow: activeTab === 'alerts' ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            🔔 Alertas {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{unreadCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9,
              fontSize: 13, fontWeight: 600,
              background: activeTab === 'scheduled' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
              color: activeTab === 'scheduled' ? '#fff' : '#64748b',
              border: 'none', cursor: 'pointer',
              boxShadow: activeTab === 'scheduled' ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            📅 Programados {scheduledCount > 0 && <span style={{ background: '#6366f1', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{scheduledCount}</span>}
          </button>
        </div>
      </div>

      <div className="px-5 space-y-3">

        {/* ── TAB: ALERTAS ── */}
        {activeTab === 'alerts' && (
          <>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="w-full py-2 px-3 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/15 active:opacity-75"
              >
                Marcar todas como leídas
              </button>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card h-16 bg-border/20 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-text-muted text-sm">Sin notificaciones aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => {
                  const meta = NOTIFICATION_META[n.type] || { icon: '🔔', label: n.type, color: '#6366f1' }
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      style={{ width: '100%', textAlign: 'left' }}
                      className={`card active:opacity-75 transition-all ${!n.read ? 'bg-primary/5 border-primary/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{meta.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {n.title}
                              </p>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                                background: `${meta.color}20`, color: meta.color,
                                display: 'inline-block',
                              }}>
                                {meta.label}
                              </span>
                            </div>
                            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />}
                          </div>
                          {n.body && (
                            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {n.body}
                            </p>
                          )}
                          <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0' }}>
                            <RelativeTime date={n.created_at} />
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── TAB: PROGRAMADOS ── */}
        {activeTab === 'scheduled' && (
          <>
            {sendSuccess && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                ✅ Recordatorio enviado por WhatsApp
              </div>
            )}

            {loadingReminders ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (<div key={i} className="card h-20 bg-border/20 animate-pulse" />))}
              </div>
            ) : (
              <>
                {/* Recordatorios activos */}
                {activeReminders.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                      🔔 Recordatorios activos ({activeReminders.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeReminders.map((r) => (
                        <ReminderCard
                          key={r.id}
                          reminder={r}
                          clientName={clientMap[r.client_id]}
                          onSendNow={handleSendNow}
                          onPause={handlePause}
                          onResume={handleResume}
                          loadingId={loadingId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Encuestas post-servicio programadas */}
                {pendingFollowUps.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 8px' }}>
                      📩 Encuestas post-servicio ({pendingFollowUps.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pendingFollowUps.map((l) => (
                        <FollowUpCard key={l.id} log={l} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recordatorios pausados */}
                {pausedReminders.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 8px' }}>
                      ⏸ Pausados ({pausedReminders.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pausedReminders.map((r) => (
                        <ReminderCard
                          key={r.id}
                          reminder={r}
                          clientName={clientMap[r.client_id]}
                          onSendNow={handleSendNow}
                          onPause={handlePause}
                          onResume={handleResume}
                          loadingId={loadingId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeReminders.length === 0 && pendingFollowUps.length === 0 && pausedReminders.length === 0 && (
                  <div className="card text-center py-12">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-text-muted text-sm">No hay envíos programados</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
