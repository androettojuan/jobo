import { useEffect, useState } from 'react'

import { loadLocalities, localitiesIfLoaded } from '@/lib/localities'
import type { Locality } from '@/types/models'

/**
 * El catálogo de localidades, que viaja en su propio archivo. Devuelve la
 * lista vacía mientras baja; si ya está en memoria, la primera pintada
 * lo tiene todo y no parpadea.
 */
export function useLocalities() {
  const [localities, setLocalities] = useState<Locality[]>(() => localitiesIfLoaded() ?? [])
  const [loading, setLoading] = useState(localitiesIfLoaded() === null)

  useEffect(() => {
    if (localitiesIfLoaded()) return

    let cancelled = false
    loadLocalities()
      .then((list) => {
        if (!cancelled) setLocalities(list)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { localities, loading }
}
