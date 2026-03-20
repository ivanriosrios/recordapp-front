// Configuración del negocio

import { useState } from 'react'
import Header from '../components/layout/Header'
import { useAppStore } from '../store/useAppStore'
import { Button } from '../components/ui/Button'
import { businessesApi } from '../api'

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const HELP_ITEMS = [
  {
    id: 'recordatorios',
    icon: '🔔',
    title: 'Recordatorios automáticos',
    content: (
      <div className="space-y-2 text-xs text-text-muted leading-relaxed">
        <p>Cada cliente puede tener un recordatorio vinculado a un servicio. La app lo envía automáticamente por WhatsApp el día programado.</p>
        <p><strong className="text-text">¿Cómo configurarlo?</strong> En la sección <em>Clientes</em>, abre un cliente y crea un recordatorio eligiendo servicio, plantilla y fecha.</p>
        <p><strong className="text-text">Tipos:</strong> <em>Único</em> (una sola vez) o <em>Recurrente</em> (se repite automáticamente cada X días).</p>
        <p>Puedes pausar, reactivar o enviar un recordatorio manualmente desde <em>Avisos → Programados</em>.</p>
      </div>
    ),
  },
  {
    id: 'servicios',
    icon: '✂️',
    title: 'Registro de servicios',
    content: (
      <div className="space-y-2 text-xs text-text-muted leading-relaxed">
        <p>Cada vez que atiendes a un cliente, puedes registrar el servicio: qué se hizo, cuánto cobró, método de pago y notas.</p>
        <p><strong className="text-text">Comprobante:</strong> Al completar el servicio puedes enviarle al cliente un resumen por WhatsApp automáticamente.</p>
        <p><strong className="text-text">Encuesta post-servicio:</strong> X días después del servicio (configurable por tipo de servicio), la app le pregunta al cliente cómo le fue. El cliente responde directamente por WhatsApp.</p>
        <p>Puedes ver el historial en la sección <em>Servicios</em> y tocar cada tarjeta para ver más detalles.</p>
      </div>
    ),
  },
  {
    id: 'encuesta',
    icon: '⭐',
    title: 'Encuesta de satisfacción',
    content: (
      <div className="space-y-2 text-xs text-text-muted leading-relaxed">
        <p>Después de cada servicio, la app programa automáticamente un mensaje de seguimiento al cliente.</p>
        <p><strong className="text-text">Flujo:</strong></p>
        <ol className="list-decimal list-inside space-y-1 ml-1">
          <li>Se completa el servicio</li>
          <li>En X días, el cliente recibe un WhatsApp preguntando cómo estuvo</li>
          <li>El cliente responde <em>"Bien"</em> o <em>"Mal"</em></li>
          <li>La app guarda la calificación y te notifica</li>
        </ol>
        <p>Puedes enviar la encuesta ahora o cancelarla desde <em>Avisos → Programados</em>. Los resultados aparecen en <em>Reportes</em>.</p>
      </div>
    ),
  },
  {
    id: 'avisos',
    icon: '📬',
    title: 'Avisos y notificaciones',
    content: (
      <div className="space-y-2 text-xs text-text-muted leading-relaxed">
        <p>La sección <em>Avisos</em> tiene dos pestañas:</p>
        <p><strong className="text-text">Alertas:</strong> Notificaciones de lo que pasó — un cliente calificó el servicio, respondió un recordatorio, pidió darse de baja, etc.</p>
        <p><strong className="text-text">Programados:</strong> Todo lo que está por enviarse — recordatorios activos y encuestas post-servicio pendientes. Puedes actuar sobre cada uno: enviar ahora, pausar o cancelar.</p>
      </div>
    ),
  },
  {
    id: 'reportes',
    icon: '📊',
    title: 'Reportes',
    content: (
      <div className="space-y-2 text-xs text-text-muted leading-relaxed">
        <p>La sección <em>Reportes</em> muestra un resumen de tu negocio en el período que elijas (semana, mes, año).</p>
        <p><strong className="text-text">Ingresos:</strong> Total cobrado, servicios realizados, valor promedio por servicio, desglose por tipo de servicio y método de pago.</p>
        <p><strong className="text-text">Satisfacción:</strong> Porcentaje de clientes satisfechos vs insatisfechos, encuestas pendientes y últimas calificaciones recibidas.</p>
      </div>
    ),
  },
  {
    id: 'automatizaciones',
    icon: '🤖',
    title: 'Automatizaciones',
    content: (
      <div className="space-y-2 text-xs text-text-muted leading-relaxed">
        <p>La app ejecuta estas acciones automáticamente sin que tengas que hacer nada:</p>
        <ul className="space-y-1.5 ml-1">
          <li>🎂 <strong className="text-text">Cumpleaños:</strong> Envía un mensaje de felicitación el día del cumpleaños del cliente.</li>
          <li>💤 <strong className="text-text">Reactivación:</strong> Si un cliente lleva más de 60 días sin visitar, le envía un mensaje invitándolo a regresar (también puedes activarlo manualmente aquí abajo).</li>
          <li>📩 <strong className="text-text">Recordatorios:</strong> Los activos se envían automáticamente en la fecha programada.</li>
          <li>⭐ <strong className="text-text">Encuestas:</strong> Se envían X días después del servicio según la configuración de cada tipo.</li>
        </ul>
      </div>
    ),
  },
]

function HelpAccordion() {
  const [openId, setOpenId] = useState(null)
  const toggle = (id) => setOpenId(prev => prev === id ? null : id)

  return (
    <div className="space-y-2">
      {HELP_ITEMS.map(item => (
        <div key={item.id} className="card p-0 overflow-hidden">
          <button
            onClick={() => toggle(item.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-medium text-text">{item.title}</span>
            </div>
            <span className="text-text-muted text-xs">{openId === item.id ? '▲' : '▼'}</span>
          </button>
          {openId === item.id && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── WhatsApp Setup ────────────────────────────────────────────────────────────

const WA_STATUS_CONFIG = {
  not_configured: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-400',
    label: 'Sin configurar',
    icon: '⚠️',
  },
  sandbox: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-400',
    label: 'Sandbox activo',
    icon: '🧪',
  },
  active: {
    color: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-400',
    label: 'WhatsApp activo',
    icon: '✅',
  },
}

const WA_STEPS = [
  {
    step: 1,
    title: 'Crea tu cuenta Twilio',
    desc: 'Ve a twilio.com y regístrate. Elige el balance inicial ($20 es suficiente para empezar).',
    link: 'https://www.twilio.com/try-twilio',
    linkLabel: 'Ir a Twilio →',
    statuses: ['not_configured', 'sandbox', 'active'],
  },
  {
    step: 2,
    title: 'Activa el Sandbox de WhatsApp',
    desc: 'En Twilio Console → Messaging → Try it out → Send a WhatsApp message. Conecta tu celular enviando el código de sandbox al número indicado. Úsalo para probar mientras Meta aprueba.',
    link: 'https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn',
    linkLabel: 'Abrir Sandbox →',
    statuses: ['not_configured', 'sandbox'],
  },
  {
    step: 3,
    title: 'Solicita acceso a WhatsApp Business API',
    desc: 'En Twilio Console → Messaging → Senders → WhatsApp senders → Request access. Necesitas un número dedicado y una cuenta de Facebook Business verificada. Meta tarda 1–3 días en aprobar.',
    link: 'https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders',
    linkLabel: 'Solicitar acceso →',
    statuses: ['not_configured', 'sandbox'],
  },
  {
    step: 4,
    title: 'Configura las variables en Railway',
    desc: 'Una vez aprobado, copia el Account SID, Auth Token y tu número de WhatsApp Business de Twilio Console y agrégalos como variables de entorno en tu servicio de Railway.',
    statuses: ['sandbox'],
  },
]

function WhatsAppSetupSection({ business, setBusiness }) {
  const status = business?.whatsapp_status || 'not_configured'
  const cfg = WA_STATUS_CONFIG[status]
  const [saving, setSaving] = useState(false)
  const [openStep, setOpenStep] = useState(null)

  const handleStatusChange = async (newStatus) => {
    setSaving(true)
    try {
      const updated = await businessesApi.update(business.id, { whatsapp_status: newStatus })
      setBusiness?.(updated)
    } catch { /* silencioso */ }
    finally { setSaving(false) }
  }

  const visibleSteps = WA_STEPS.filter(s => s.statuses.includes(status))

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-text text-sm">WhatsApp Business</h3>
      <div className="card space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{cfg.icon}</span>
            <div>
              <p className="text-sm font-semibold text-text">Estado actual</p>
              <span className={`inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>
          {/* Selector rápido de estado */}
          {status !== 'active' && (
            <div className="flex flex-col gap-1">
              {status === 'not_configured' && (
                <button
                  onClick={() => handleStatusChange('sandbox')}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium disabled:opacity-60"
                >
                  {saving ? '...' : 'Ya tengo Sandbox'}
                </button>
              )}
              <button
                onClick={() => handleStatusChange('active')}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 font-medium disabled:opacity-60"
              >
                {saving ? '...' : 'Meta me aprobó ✅'}
              </button>
            </div>
          )}
          {status === 'active' && (
            <button
              onClick={() => handleStatusChange('not_configured')}
              disabled={saving}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface text-text-muted border border-border font-medium disabled:opacity-60"
            >
              Reconfigurar
            </button>
          )}
        </div>

        {/* Pasos según estado */}
        {status !== 'active' && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {status === 'not_configured' ? 'Pasos para activar' : 'Pendiente de aprobación'}
              </p>
              {visibleSteps.map(s => (
                <div key={s.step} className="rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setOpenStep(openStep === s.step ? null : s.step)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left bg-surface"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {s.step}
                    </span>
                    <span className="text-sm font-medium text-text flex-1">{s.title}</span>
                    <span className="text-text-muted text-xs">{openStep === s.step ? '▲' : '▼'}</span>
                  </button>
                  {openStep === s.step && (
                    <div className="px-3 pb-3 pt-2 space-y-2 bg-card border-t border-border">
                      <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
                      {s.link && (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-primary font-medium hover:underline"
                        >
                          {s.linkLabel}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted bg-surface rounded-lg px-3 py-2 leading-relaxed">
              💡 Mientras Meta aprueba tu número, puedes usar la app normalmente — clientes, citas y reportes funcionan sin WhatsApp. Los mensajes automáticos se activarán cuando confirmes la aprobación arriba.
            </p>
          </>
        )}

        {status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs text-green-700">
            🎉 Tu WhatsApp Business está activo. Los recordatorios, cumpleaños y automatizaciones se envían normalmente.
          </div>
        )}
      </div>
    </section>
  )
}

export default function SettingsPage() {
  const { business, logout, setBusiness } = useAppStore()
  const [sendingReactivation, setSendingReactivation] = useState(false)
  const [reactivationMessage, setReactivationMessage] = useState(null)

  // Automation settings state (initialized from business object)
  const [inactiveDays, setInactiveDays] = useState(business?.inactive_days_threshold ?? 60)
  const [reactivationEnabled, setReactivationEnabled] = useState(business?.reactivation_enabled ?? true)
  const [birthdayEnabled, setBirthdayEnabled] = useState(business?.birthday_enabled ?? true)
  const [followUpAutoEnabled, setFollowUpAutoEnabled] = useState(business?.follow_up_auto_enabled ?? true)
  const [savingAutomation, setSavingAutomation] = useState(false)
  const [automationMessage, setAutomationMessage] = useState(null)

  // Master toggle: true si alguna está activa
  const allEnabled = reactivationEnabled || birthdayEnabled || followUpAutoEnabled
  const handleMasterToggle = (val) => {
    setReactivationEnabled(val)
    setBirthdayEnabled(val)
    setFollowUpAutoEnabled(val)
  }

  const handleSaveAutomation = async () => {
    if (inactiveDays < 1 || inactiveDays > 365) {
      setAutomationMessage({ type: 'error', text: 'El número de días debe estar entre 1 y 365.' })
      return
    }
    setSavingAutomation(true)
    setAutomationMessage(null)
    try {
      const updated = await businessesApi.update(business.id, {
        inactive_days_threshold: Number(inactiveDays),
        reactivation_enabled: reactivationEnabled,
        birthday_enabled: birthdayEnabled,
        follow_up_auto_enabled: followUpAutoEnabled,
      })
      setBusiness?.(updated)
      setAutomationMessage({ type: 'success', text: 'Configuración guardada correctamente.' })
    } catch {
      setAutomationMessage({ type: 'error', text: 'Error al guardar. Intenta de nuevo.' })
    } finally {
      setSavingAutomation(false)
    }
  }

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

        {/* WhatsApp Business Setup */}
        <WhatsAppSetupSection business={business} setBusiness={setBusiness} />

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

        {/* Automatizaciones */}
        <section className="space-y-3">
          <h3 className="font-semibold text-text text-sm">Automatizaciones</h3>
          <div className="card space-y-4">

            {/* Master toggle */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-text">Todas las automatizaciones</p>
                <p className="text-xs text-text-muted">Activa o desactiva todas a la vez</p>
              </div>
              <Toggle enabled={allEnabled} onChange={handleMasterToggle} />
            </div>

            {/* Días de inactividad */}
            <div>
              <p className="text-sm font-medium text-text mb-0.5">Cliente inactivo después de</p>
              <p className="text-xs text-text-muted mb-2">
                Si un cliente no tiene servicios en este período, se considera inactivo y puede recibir un mensaje de reactivación.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={inactiveDays}
                  onChange={e => setInactiveDays(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-sm text-text-muted">días sin visita</span>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Reactivación automática */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">Reactivación automática</p>
                <p className="text-xs text-text-muted">Envía un mensaje semanal a clientes inactivos.</p>
              </div>
              <Toggle enabled={reactivationEnabled} onChange={setReactivationEnabled} />
            </div>

            {/* Cumpleaños */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">Felicitación de cumpleaños</p>
                <p className="text-xs text-text-muted">Envía un WhatsApp el día del cumpleaños del cliente.</p>
              </div>
              <Toggle enabled={birthdayEnabled} onChange={setBirthdayEnabled} />
            </div>

            {/* Encuesta post-servicio automática */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">Encuesta post-servicio</p>
                <p className="text-xs text-text-muted">Envía automáticamente la encuesta de satisfacción X días después del servicio.</p>
              </div>
              <Toggle enabled={followUpAutoEnabled} onChange={setFollowUpAutoEnabled} />
            </div>

            <div className="border-t border-border pt-1">
              <Button
                onClick={handleSaveAutomation}
                disabled={savingAutomation}
                variant="primary"
              >
                {savingAutomation ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              {automationMessage && (
                <div
                  className={`mt-3 rounded-lg p-2.5 text-xs ${
                    automationMessage.type === 'success'
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-danger/10 text-danger border border-danger/30'
                  }`}
                >
                  {automationMessage.text}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="space-y-3">
          <h3 className="font-semibold text-text text-sm">¿Cómo funciona la app?</h3>
          <HelpAccordion />
        </section>

        {/* Soporte */}
        <section className="space-y-3">
          <h3 className="font-semibold text-text text-sm">Soporte</h3>
          <div className="card">
            <p className="text-text-muted text-xs mb-3">
              ¿Tienes dudas o problemas? Escríbenos por WhatsApp.
            </p>
            <a
              href={`https://wa.me/${import.meta.env.VITE_SUPPORT_PHONE || '573145672689'}?text=${encodeURIComponent('Hola, necesito ayuda con OlaApp')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar soporte
            </a>
          </div>
        </section>

        <Button variant="danger" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
