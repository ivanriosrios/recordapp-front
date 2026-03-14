export function Select({ label, options = [], error, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-text-muted text-xs font-medium mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`input-base ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-danger text-xs">{error}</p>}
    </div>
  )
}
