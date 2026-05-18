/**
 * Valor RecordApp — tres números clave que justifican la suscripción.
 * Diseñado para vivir embebido en Dashboard o Reports.
 */
import { useQuery } from '@tanstack/react-query'
import { valueApi } from '../api'

function fmtMoney(n) {
  if (n == null) return '$0'
  return `$${Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

function pct(n) {
  return `${(Math.round((n || 0) * 1000) / 10).toFixed(1)}%`
}

export default function ValueDashboard({ businessId, period = 'month' }) {
  const q = useQuery({
    queryKey: ['value-dashboard', businessId, period],
    queryFn: () => valueApi.dashboard(businessId, { period }),
    enabled: !!businessId,
  })

  if (q.isLoading) {
    return (
      <div style={{
        background: '#1e2235', border: '1px solid #2d3148', borderRadius: 16,
        padding: 16, height: 100, opacity: 0.5,
      }} />
    )
  }

  const d = q.data || {}
  const periodLabel = { week: 'esta semana', month: 'este mes', quarter: 'este trimestre', year: 'este año' }[period] || ''

  return (
    <section>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 10px' }}>
        🎯 Valor RecordApp {periodLabel && `(${periodLabel})`}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Card
          color="#ef4444"
          icon="🚫"
          label="No-shows"
          value={pct(d.no_show_rate)}
          sub={`${d.no_shows || 0} de ${d.total_appointments || 0}`}
          hint={d.total_appointments === 0 ? 'sin citas aún' : 'menor es mejor'}
        />
        <Card
          color="#8b5cf6"
          icon="🔄"
          label="Reactivados"
          value={String(d.reactivated_clients || 0)}
          sub="clientes"
          hint="vinieron tras un recordatorio"
        />
        <Card
          color="#10b981"
          icon="💰"
          label="Atribuido"
          value={fmtMoney(d.attributed_revenue)}
          sub={`de ${fmtMoney(d.total_revenue)}`}
          hint="ingresos influenciados"
        />
      </div>
    </section>
  )
}

function Card({ color, icon, label, value, sub, hint }) {
  return (
    <div style={{
      background: '#1e2235', border: '1px solid #2d3148',
      borderRadius: 14, padding: 12,
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{sub}</p>
    </div>
  )
}
