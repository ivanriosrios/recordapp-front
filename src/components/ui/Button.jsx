export function Button({ children, variant = 'primary', className = '', disabled, onClick, type = 'button' }) {
  const base = 'flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-colors duration-150 disabled:opacity-50'

  const variants = {
    primary: 'w-full py-3.5 bg-primary text-white active:bg-primary-dark',
    secondary: 'w-full py-3.5 border border-border text-text-muted active:bg-card',
    ghost: 'px-3 py-2 text-text-muted active:bg-card',
    danger: 'w-full py-3.5 bg-danger text-white active:opacity-80',
    icon: 'p-2 rounded-xl text-text-muted active:bg-card',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
