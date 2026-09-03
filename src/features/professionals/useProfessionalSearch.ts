import { useEffect, useMemo, useState } from 'react'

import { useBlocked } from '@/features/blocks/useBlocked'
import type { Professional } from '@/types/models'

import { filterByText, searchProfessionals } from './api'

interface Options {
  term: string
  categoryId?: string
  localityId?: string
}

/** Identifica la consulta: el texto no entra, porque se filtra en memoria. */
const queryKey = (categoryId?: string, localityId?: string) =>
  `${categoryId ?? ''}|${localityId ?? ''}`

/**
 * Profesionales que coinciden con el rubro elegido y/o el texto escrito.
 * La consulta a Firestore depende solo del rubro y la localidad; el texto se
 * filtra en memoria sobre lo ya traído, así escribir no cuesta una lectura
 * por tecla. Para el volumen de un pueblo alcanza de sobra.
 */
export function useProfessionalSearch({ term, categoryId, localityId }: Options) {
  const blocked = useBlocked()
  const [all, setAll] = useState<Professional[]>([])
  const [error, setError] = useState('')
  /**
   * Consulta cuyos resultados están en `all`. Es estado y no una ref para que
   * la pantalla sepa, ya en el primer render, que todavía no hay datos: si no,
   * alcanza a pintar "sin resultados" antes de que empiece la carga.
   */
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const active = term.trim().length > 0 || Boolean(categoryId)
  const key = queryKey(categoryId, localityId)
  const ready = loadedKey === key

  useEffect(() => {
    if (!active || ready) return

    let cancelled = false
    setError('')

    searchProfessionals({ categoryId, localityId, max: 100 })
      .then((list) => {
        // La consulta solo se da por cargada al terminar: si se cancela a mitad
        // de camino, el próximo intento tiene que volver a pedirla.
        if (cancelled) return
        setAll(list)
        setLoadedKey(key)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos buscar ahora. Probá de nuevo.')
      })

    return () => {
      cancelled = true
    }
  }, [active, ready, key, categoryId, localityId])

  // A quien bloqueaste no lo ves más en los resultados. Se filtra acá y no en
  // la consulta porque Firestore no sabe de bloqueos, y son pocos: la lista
  // que se trae está topeada en 100.
  const results = useMemo(
    () =>
      active && ready
        ? filterByText(all, term).filter((profesional) => !blocked.has(profesional.uid))
        : [],
    [active, ready, all, term, blocked],
  )

  return {
    results,
    loading: active && !ready && !error,
    error: active ? error : '',
  }
}
