import { useEffect, useMemo, useRef, useState } from 'react'

const COUNTRIES = [
  { code: 'CO', name: 'Colombia', dialCode: '57', flag: '🇨🇴' },
  { code: 'MX', name: 'México', dialCode: '52', flag: '🇲🇽' },
  { code: 'PE', name: 'Perú', dialCode: '51', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', dialCode: '56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', dialCode: '54', flag: '🇦🇷' },
  { code: 'ES', name: 'España', dialCode: '34', flag: '🇪🇸' },
  { code: 'US', name: 'USA', dialCode: '1', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', dialCode: '55', flag: '🇧🇷' },
]

function parseFromValue(value) {
  if (!value) return null
  const sanitized = value.replace(/[^\d+]/g, '')
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  for (const country of sortedCountries) {
    const needle = `+${country.dialCode}`
    if (sanitized.startsWith(needle)) {
      const local = sanitized.slice(needle.length).replace(/^0+/, '')
      return { country, local }
    }
  }
  return null
}

export function PhoneInput({ label, value, onChange, error, className = '' }) {
  const containerRef = useRef(null)
  const parsed = useMemo(() => parseFromValue(value), [value])
  const [selected, setSelected] = useState(parsed?.country || COUNTRIES[0])
  const [localNumber, setLocalNumber] = useState(parsed?.local || '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (parsed) {
      setSelected(parsed.country)
      setLocalNumber(parsed.local)
    }
  }, [parsed])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const emitChange = (country, local) => {
    const cleanLocal = local.replace(/\D/g, '')
    const formatted = cleanLocal ? `+${country.dialCode} ${cleanLocal}` : `+${country.dialCode}`
    onChange?.(formatted)
  }

  const handleCountrySelect = (country) => {
    setSelected(country)
    setOpen(false)
    emitChange(country, localNumber)
  }

  const handleLocalChange = (next) => {
    setLocalNumber(next)
    emitChange(selected, next)
  }

  return (
    <div className={`mb-4 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-text-muted text-xs font-medium mb-1.5">
          {label}
        </label>
      )}

      <div className={`flex items-center gap-2 rounded-xl border text-sm bg-card ${error ? 'border-danger' : 'border-border'} px-3 py-2.5 focus-within:border-primary transition-colors`}>
        <button
          type="button"
          className="flex items-center gap-2 pr-2 border-r border-border text-text-muted focus:outline-none"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Seleccionar país"
        >
          <span className="text-lg" aria-hidden>{selected.flag}</span>
          <span className="font-medium text-text">+{selected.dialCode}</span>
          <svg
            className="w-3 h-3 text-text-muted"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1.25L5 5L9 1.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        <input
          type="tel"
          inputMode="tel"
          placeholder="300 123 4567"
          className="flex-1 bg-transparent outline-none text-text placeholder:text-text-muted"
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
        />
      </div>

      {open && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg"> 
          {COUNTRIES.map((country) => (
            <button
              type="button"
              key={country.code}
              onClick={() => handleCountrySelect(country)}
              className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface transition-colors ${selected.code === country.code ? 'bg-primary/10 text-text' : 'text-text-muted'}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>{country.flag}</span>
                <span className="font-medium text-text">{country.name}</span>
              </span>
              <span className="font-semibold text-text">+{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-danger text-xs">{error}</p>}
    </div>
  )
}
