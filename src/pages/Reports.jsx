import { useState, useEffect } from 'react'
import { reportsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import Header from '../components/layout/Header'

// ─── Helpers ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  n == null ? '-' : `$${Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
]

const PAYMENT_LABEL = {
  efectivo: '💵 Efectivo',
  tarjeta: '💳 Tarjeta',
  transferencia: '🏦 Transf.',
  sin_registrar: '— Sin registro',
}

// ─── Mini bar chart (CSS) ─────────────────────────────────────────────────
function BarChart({ data, valueKey = 'revenue', labelKey = 'date' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-text-muted text-sm">
        Sin datos para este período
      </div>
    )
  }
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-0.5 h-28 overflow-x-auto pb-1">
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] / max) * 100)
        return (
          <div key={i} className="flex flex-col items-center flex-1 min-w-[6px] group">
            <div
              className="w-full bg-primary/70 rounded-t-sm group-hover:bg-primary transition-colors"
              style={{ height: `${Math.max(pct, 2)}%` }}
              title={`${d[labelKey]}: ${fmt(d[valueKey])}`}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="card flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <p className="text-text-muted text-xs truncate">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color} truncate`}>{value}</p>
      {sub && <p className="text-text-muted text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { business } = useAppStore()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (p = period) => {
    if (!business?.id) return
    setLoading(true)
    setError(null)
    try {
      const [summary, tl] = await Promise.all([
        reportsApi.income(business.id, { period: p }),
        reportsApi.timeline(business.id, { period: p }),
      ])
      setData(summary)
      setTimeline(tl)
    } catch (err) {
      setError(err.message || 'Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(period)
  }, [business?.id, period])

  const handleExport = () => {
    if (!business?.id) return
    const base = import.meta.env.VITE_API_URL || ''
    const url = `${base}/api/v1/businesses/${business.id}/reports/income/export?period=${period}`
    window.open(url, '_blank')
  }

  return (
    <div className="pb-24">
      <Header
        title="Reportes"
        onBack={false}
        rightAction={
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-primary text-sm font-medium px-3 py-1.5 rounded-xl bg-primary/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
        }
      />

      {/* Period selector */}
      <div className="px-5 pb-3">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                period === p.key
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-text-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-4 bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 bg-border/20 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="px-5 space-y-4">
          {/* KPIs principales */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              icon="💰"
              label="Ingresos totales"
              value={fmt(data.total_revenue)}
              sub={`${data.services_with_price} con precio`}
              color="text-success"
            />
            <KpiCard
              icon="✂️"
              label="Servicios"
              value={data.all_services_count}
              sub={`${data.services_with_price} facturados`}
              color="text-primary"
            />
            <KpiCard
              icon="🎯"
              label="Ticket promedio"
              value={fmt(data.avg_ticket)}
              color="text-warning"
            />
            <KpiCard
              icon="🏆"
              label="Top servicio"
              value={data.by_service?.[0]?.service_name || '—'}
              sub={data.by_service?.[0] ? fmt(data.by_service[0].revenue) : ''}
              color="text-text"
            />
          </div>

          {/* Gráfica de ingresos diarios */}
          <div className="card">
            <h3 className="text-text font-semibold text-sm mb-3">
              📊 Ingresos por día
            </h3>
            <BarChart data={timeline} valueKey="revenue" labelKey="date" />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              {timeline.length > 0 && (
                <>
                  <span>{timeline[0]?.date?.slice(5)}</span>
                  {timeline.length > 1 && <span>{timeline[timeline.length - 1]?.date?.slice(5)}</span>}
                </>
              )}
            </div>
          </div>

          {/* Por servicio */}
          {data.by_service?.length > 0 && (
            <div className="card">
              <h3 className="text-text font-semibold text-sm mb-3">Por servicio</h3>
              <div className="space-y-2">
                {data.by_service.map((s, i) => {
                  const pct = data.total_revenue > 0 ? (s.revenue / data.total_revenue) * 100 : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-text font-medium truncate flex-1 mr-2">{s.service_name}</span>
                        <span className="text-text-muted flex-shrink-0">{s.count}x · {fmt(s.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Por método de pago */}
          {data.by_payment?.length > 0 && (
            <div className="card">
              <h3 className="text-text font-semibold text-sm mb-3">Por método de pago</h3>
              <div className="space-y-2">
                {data.by_payment.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{PAYMENT_LABEL[p.method] || p.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-text text-sm font-semibold">{fmt(p.revenue)}</p>
                      <p className="text-text-muted text-xs">{p.count} servicios</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {data.all_services_count === 0 && (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-text font-semibold text-sm">Sin datos en este período</p>
              <p className="text-text-muted text-xs mt-1">
                Registra servicios completados con precio para ver reportes.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
