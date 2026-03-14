// Configuración del negocio

import Header from '../components/layout/Header'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'

export default function SettingsPage() {
  const { business, logout } = useAppStore()

  return (
    <div>
      <Header title="Configuración" onBack={false} />
      <div className="p-5 space-y-4">
        <div className="card">
          <p className="text-text-muted text-xs mb-1">Negocio</p>
          <p className="font-semibold">{business?.name || '—'}</p>
          <p className="text-text-muted text-xs mt-1">{business?.plan || 'free'}</p>
        </div>
        <Button variant="danger" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
