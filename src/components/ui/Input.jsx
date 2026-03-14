export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-text-muted text-xs font-medium mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`input-base ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-danger text-xs">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-text-muted text-xs font-medium mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={3}
        className={`input-base resize-none ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-danger text-xs">{error}</p>}
    </div>
  )
}
