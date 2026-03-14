/** Formatea precio en COP */
export function formatPrice(amount) {
  if (!amount) return ''
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Formatea fecha a texto legible */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Días transcurridos desde una fecha */
export function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/** Nombre a mostrar: apodo + nombre completo */
export function clientLabel(client) {
  if (!client) return ''
  if (client.full_name && client.display_name !== client.full_name) {
    return `${client.display_name} (${client.full_name})`
  }
  return client.display_name
}

/** Iniciales para avatar */
export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
