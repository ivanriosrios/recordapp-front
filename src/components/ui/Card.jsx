export function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`card ${onClick ? 'cursor-pointer active:opacity-80' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, color = 'text-primary' }) {
  return (
    <div className="card flex-1 min-w-0">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-text text-xs font-medium mt-0.5">{label}</div>
      {sub && <div className="text-text-muted text-xs mt-0.5">{sub}</div>}
    </div>
  )
}
