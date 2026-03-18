import { useState, useEffect } from 'react'
import { reportsApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import Header from '../components/layout/Header'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n == null ? '-' : `$${Number(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year',  label: 'Año' },
]

const PERIOD_PREV_LABEL = {
  today: 'vs. ayer',
  week:  'vs. sem. anterior',
  month: 'vs. mes anterior',
  year:  'vs. año anterior',
}

const PAYMENT_LABEL = {
  efectivo:      '💵 Efectivo',
  tarjeta:       '💳 Tarjeta',
  transferencia: '🏦 Transf.',
  sin_registrar: '— Sin registro',
}

// ─── Growth badge ─────────────────────────────────────────────────────────────

function GrowthBadge({ pct, label }) {
  if (pct == null) return null
  const isUp = pct >= 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        background: isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        color: isUp ? '#10b981' : '#ef4444',
        borderRadius: 999, padding: '3px 8px',
        fontSize: 12, fontWeight: 700,
      }}>
        {isUp ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
      </span>
      {label && <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color = '#6366f1', growth, growthLabel, accent }) {
  return (
    <div
      className="card"
      style={{
        flex: 1, minWidth: 0, padding: '14px',
        borderColor: accent ? `${color}40` : undefined,
        background: accent ? `${color}0a` : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: `${color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>{icon}</span>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{label}</p>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{sub}</p>}
        </div>
        {growth != null && <GrowthBadge pct={growth} label={growthLabel} />}
      </div>
    </div>
  )
}

// ─── Mini bar chart (CSS) ─────────────────────────────────────────────────────

function BarChart({ data, valueKey = 'revenue', labelKey = 'date' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 13 }}>Sin datos para este período</p>
      </div>
    )
  }
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90, overflow: 'hidden' }}>
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] / max) * 100)
        return (
          <div
            key={i}
            style={{
              flex: 1, minWidth: 4,
              height: `${Math.max(pct, 3)}%`,
              background: pct > 80
                ? 'linear-gradient(180deg, #818cf8, #6366f1)'
                : 'linear-gradient(180deg, #4f46e522, #6366f155)',
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.3s ease',
            }}
            title={`${d[labelKey]}: ${fmt(d[valueKey])}`}
          />
        )
      })}
    </div>
  )
}

// ─── Service row ──────────────────────────────────────────────────────────────

function ServiceRow({ name, count, revenue, pct }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', flex: 1, marginRight: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
          {count}x · {fmt(revenue)}
        </span>
      </div>
      <div style={{ height: 4, background: '#2d3148', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          borderRadius: 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

  useEffect(() => { load(period) }, [business?.id, period])

  const handleExport = () => {
    if (!business?.id) return
    const base = import.meta.env.VITE_API_URL || ''
    const url = `${base}/api/v1/businesses/${business.id}/reports/income/export?period=${period}`
    window.open(url, '_blank')
  }

  const prevLabel = PERIOD_PREV_LABEL[period] || 'vs. período anterior'

  // Calcular growth de servicios
  const servicesGrowth = data
    ? data.prev_services_count > 0
      ? ((data.services_with_price - data.prev_services_count) / data.prev_services_count) * 100
      : data.services_with_price > 0 ? 100 : 0
    : null

  return (
    <div style={{ paddingBottom: 90 }}>
      <Header
        title="Reportes"
        onBack={false}
        rightAction={
          <button
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,102,241,0.12)', color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 12, padding: '6px 12px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
        }
      />

      {/* Period selector */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          display: 'flex', gap: 6,
          background: '#1e2235', borderRadius: 14,
          padding: 4, border: '1px solid #2d3148',
        }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                flex: 1, padding: '8px 0',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s',
                background: period === p.key
                  ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                  : 'transparent',
                color: period === p.key ? '#fff' : '#64748b',
                border: 'none', cursor: 'pointer',
                boxShadow: period === p.key ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          margin: '0 20px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: '12px 16px', color: '#ef4444', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[80, 120, 100].map((h, i) => (
            <div key={i} style={{ height: h, background: '#1e2235', borderRadius: 16, opacity: 0.5 }} />
          ))}
        </div>
      ) : data ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPIs principales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <KpiCard
              icon="💰" label="Ingresos totales"
              value={fmt(data.total_revenue)}
              sub={`${data.services_with_price} con precio`}
              color="#10b981"
              growth={data.growth_pct}
              growthLabel={prevLabel}
              accent
            />
            <KpiCard
              icon="✂️" label="Servicios"
              value={data.all_services_count}
              sub={`${data.services_with_price} facturados`}
              color="#6366f1"
              growth={servicesGrowth}
              growthLabel={prevLabel}
            />
            <KpiCard
              icon="🎯" label="Ticket promedio"
              value={fmt(data.avg_ticket)}
              color="#f59e0b"
            />
            <KpiCard
              icon="🏆" label="Top servicio"
              value={data.by_service?.[0]?.service_name || '—'}
              sub={data.by_service?.[0] ? fmt(data.by_service[0].revenue) : ''}
              color="#8b5cf6"
            />
          </div>

          {/* Comparativa highlight */}
          {data.prev_total_revenue != null && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>Período anterior</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                  {fmt(data.prev_total_revenue)}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>Cambio</p>
                <GrowthBadge pct={data.growth_pct} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>Actual</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {fmt(data.total_revenue)}
                </p>
              </div>
            </div>
          )}

          {/* Gráfica */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>📊 Ingresos por día</h3>
              {timeline.length > 0 && (
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {timeline[0]?.date?.slice(5)} — {timeline[timeline.length - 1]?.date?.slice(5)}
                </span>
              )}
            </div>
            <BarChart data={timeline} valueKey="revenue" labelKey="date" />
          </div>

          {/* Por servicio */}
          {data.by_service?.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 14px' }}>
                Por servicio
              </h3>
              {data.by_service.map((s, i) => {
                const pct = data.total_revenue > 0 ? (s.revenue / data.total_revenue) * 100 : 0
                return (
                  <ServiceRow key={i} name={s.service_name} count={s.count} revenue={s.revenue} pct={pct} />
                )
              })}
            </div>
          )}

          {/* Por método de pago */}
          {data.by_payment?.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 14px' }}>
                Por método de pago
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.by_payment.map((p, i) => {
                  const pct = data.total_revenue > 0 ? (p.revenue / data.total_revenue) * 100 : 0
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                          {PAYMENT_LABEL[p.method] || p.method}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{fmt(p.revenue)}</span>
                          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{p.count} serv.</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: '#2d3148', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                          borderRadius: 2,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {data.all_services_count === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
                Sin datos en este período
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Registra servicios completados con precio para ver reportes.
              </p>
            </div>
          )}

        </div>
      ) : null}
    </div>
  )
}
