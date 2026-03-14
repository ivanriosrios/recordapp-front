import { useState, useCallback } from 'react'

/**
 * Hook genérico para llamadas a la API.
 * Maneja loading, error y datos.
 *
 * Uso:
 *   const { data, loading, error, execute } = useApi(clientsApi.list)
 *   await execute(businessId, { status: 'active' })
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFn(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err.message || 'Error desconocido')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFn]
  )

  return { data, loading, error, execute }
}
