import { useEffect, useRef, useState } from 'react'

import { filterByText, searchProfessionals } from './api'
import type { Professional } from '@/types/models'

/**
 * Búsqueda por texto sobre los profesionales de la localidad elegida.
 * Trae la lista una sola vez —recién cuando el usuario empieza a escribir— y
 * después filtra en memoria: para el volumen de un pueblo alcanza de sobra y
 * evita una lectura a Firestore por cada tecla.
 */
export function useProfessionalSearch(term: string, localityId?: string) {
  const [all, setAll] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Localidad ya traída, para no repetir la consulta en cada tecleo.
  const loadedFor = useRef<string | null>(null)

  const active = term.trim().length > 0

  useEffect(() => {
    if (!active) return

    const key = localityId ?? ''
    if (loadedFor.current === key) return
    loadedFor.current = key

    let cancelled = false
    setAll([])
    setLoading(true)
    setError('')

    searchProfessionals({ localityId, max: 100 })
      .then((list) => {
        if (!cancelled) setAll(list)
      })
      .catch(() => {
        if (cancelled) return
        setError('No pudimos buscar ahora. Probá de nuevo.')
        loadedFor.current = null // que el próximo intento reintente
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [active, localityId])

  return {
    results: active ? filterByText(all, term) : [],
    loading: active && loading,
    error: active ? error : '',
  }
}
