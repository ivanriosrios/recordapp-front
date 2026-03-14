import { useNavigate } from 'react-router-dom'

export default function Header({ title, onBack, rightAction }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <header className="flex items-center gap-3 px-5 py-4 sticky top-0 bg-bg/95 backdrop-blur-sm z-10 border-b border-border/50">
      {onBack !== false && (
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-xl text-text-muted active:bg-card transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-text">{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </header>
  )
}
