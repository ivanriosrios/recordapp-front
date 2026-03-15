import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { formatDate } from '../utils/format'

function NotificationIcon({ type }) {
  const icons = {
    reminder_sent: '📤',
    reminder_failed: '❌',
    client_responded: '💬',
    client_optout: '🚫',
    follow_up_rated: '⭐',
    birthday_sent: '🎂',
    reactivation_sent: '🔄',
  }
  return icons[type] || '🔔'
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

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { business } = useAppStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    loadNotifications()
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

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markRead(business.id, id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
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

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs">Notificaciones</p>
          <h1 className="text-lg font-bold text-text">
            {unreadCount > 0 ? (
              <>
                Tienes <span className="text-primary">{unreadCount}</span> sin leer
              </>
            ) : (
              'Todas leídas'
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

      <div className="px-5 pb-20 space-y-3">
        {/* Botón marcar todas como leídas */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="w-full py-2 px-3 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/15 active:opacity-75"
          >
            Marcar todas como leídas
          </button>
        )}

        {/* Lista de notificaciones */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card h-16 bg-border/20 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-text-muted text-sm">Sin notificaciones aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`w-full card text-left active:opacity-75 transition-all ${
                  !n.read ? 'bg-primary/5 border-primary/30' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {NotificationIcon({ type: n.type })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-text text-sm">{n.title}</p>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-text-muted text-xs mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-text-muted text-xs mt-1">
                      <RelativeTime date={n.created_at} />
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
