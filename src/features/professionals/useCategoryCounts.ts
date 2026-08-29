import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/lib/firebase'

/**
 * Cantidad de profesionales activos por categoría y localidad.
 * Lo mantiene una Cloud Function en `stats/categories`, con la forma:
 *   { total: { plomero: 3 }, byLocality: { 'villa-rumipal': { plomero: 2 } } }
 * Mientras no exista el documento devolvemos vacío y la UI no muestra conteos.
 */
export interface CategoryCounts {
  total: Record<string, number>
  byLocality: Record<string, Record<string, number>>
}

export function useCategoryCounts(localityId?: string) {
  const [counts, setCounts] = useState<CategoryCounts>({ total: {}, byLocality: {} })

  useEffect(() => {
    return onSnapshot(
      doc(db, 'stats', 'categories'),
      (snap) => setCounts((snap.data() as CategoryCounts) ?? { total: {}, byLocality: {} }),
      () => setCounts({ total: {}, byLocality: {} }),
    )
  }, [])

  const scoped = localityId ? (counts.byLocality[localityId] ?? {}) : counts.total
  return {
    counts: scoped,
    /** true cuando todavía no hay ningún dato de conteo cargado. */
    empty: Object.keys(scoped).length === 0,
  }
}
