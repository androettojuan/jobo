import { useEffect, useRef, useState } from 'react'

import { filterByText, searchProfessionals } from './api'
import type { Professional } from '@/types/models'

interface Options {
  term: string
  categoryId?: string
  localityId?: string
}

/**
 * Profesionales que coinciden con el rubro elegido y/o el texto escrito.
 * La consulta a Firestore depende solo del rubro y la localidad; el texto se
 * filtra en memoria sobre lo ya traído, así escribir no cuesta una lectura
 * por tecla. Para el volumen de un pueblo alcanza de sobra.
 */
export function useProfessionalSearch({ term, categoryId, localityId }: Options) {
  const [all, setAll] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Consulta ya traída, para no repetirla en cada tecleo.
  const loadedFor = useRef<string | null>(null)

  const active = term.trim().length > 0 || Boolean(categoryId)

  useEffect(() => {
    if (!active) return

    const key = `${categoryId ?? ''}|${localityId ?? ''}`
    if (loadedFor.current === key) return
    loadedFor.current = key

    let cancelled = false
    setAll([])
    setLoading(true)
    setError('')

    searchProfessionals({ categoryId, localityId, max: 100 })
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
  }, [active, categoryId, localityId])

  return {
    results: active ? filterByText(all, term) : [],
    loading: active && loading,
    error: active ? error : '',
  }
}
