const variants = {
  success: 'bg-success/15 text-success',
  danger:  'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary-light',
  muted:   'bg-border text-text-muted',
}

export function Badge({ children, variant = 'muted', className = '' }) {
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
