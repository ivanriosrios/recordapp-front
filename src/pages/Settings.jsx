// Configuración del negocio

import { useState } from 'react'
import Header from '../components/layout/Header'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { businessesApi } from '../api'

export default function SettingsPage() {
  const { business, logout } = useAppStore()
  const [sendingReactivation, setSendingReactivation] = useState(false)
  const [reactivationMessage, setReactivationMessage] = useState(null)

  const handleSendReactivation = async () => {
    setSendingReactivation(true)
    setReactivationMessage(null)
    try {
      const result = await businessesApi.sendReactivation(business.id)
      setReactivationMessage({
        type: 'success',
        text: `Se enviaron ${result.queued || 0} mensajes de reactivación`
      })
    } catch (err) {
      setReactivationMessage({
        type: 'error',
        text: err.message || 'Error al enviar reactivación'
      })
    } finally {
      setSendingReactivation(false)
    }
  }

  return (
    <div>
      <Header title="Configuración" onBack={false} />
      <div className="p-5 space-y-4">
        <div className="card">
          <p className="text-text-muted text-xs mb-1">Negocio</p>
          <p className="font-semibold">{business?.name || '—'}</p>
          <p className="text-text-muted text-xs mt-1">{business?.plan || 'free'}</p>
        </div>

        <section className="space-y-3">
          <h3 className="font-semibold text-text text-sm">Clientes inactivos</h3>
          <div className="card">
            <p className="text-text-muted text-xs mb-3">
              Enviar mensaje de reactivación a clientes sin servicio hace más de 60 días.
            </p>
            <Button
              onClick={handleSendReactivation}
              disabled={sendingReactivation}
              variant="secondary"
            >
              {sendingReactivation ? 'Enviando...' : 'Enviar reactivación'}
            </Button>
            {reactivationMessage && (
              <div
                className={`mt-3 rounded-lg p-2.5 text-xs ${
                  reactivationMessage.type === 'success'
                    ? 'bg-success/10 text-success border border-success/30'
                    : 'bg-danger/10 text-danger border border-danger/30'
                }`}
              >
                {reactivationMessage.text}
              </div>
            )}
          </div>
        </section>

        <Button variant="danger" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
