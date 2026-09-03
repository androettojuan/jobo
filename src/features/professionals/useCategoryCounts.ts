import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/lib/firebase'

/**
 * La clave lleva versión: acá se guarda un objeto con forma, no un booleano.
 * Si `CategoryCounts` cambia, se sube el número y los teléfonos con la copia
 * vieja arrancan sin ella en vez de leerla como si fuera la nueva.
 */
const CACHE_KEY = 'jobo:category-counts:v1'

const VACIO: CategoryCounts = { total: {}, byLocality: {} }

/**
 * Los últimos conteos que vio este teléfono.
 *
 * Sin esto, la home se dibuja con la grilla en orden alfabético y sin números,
 * y cuando llega `stats/categories` los oficios **se reordenan** —los que
 * tienen gente van primero— y aparecen las leyendas. Ese salto se ve en cada
 * arranque. Con la copia local la primera pintada ya sale bien, y cuando llega
 * el dato real casi nunca cambia nada: los conteos de un pueblo se mueven poco.
 *
 * Es una copia para dibujar, no una fuente de verdad: se pisa con lo que diga
 * el servidor apenas contesta.
 */
function leerCache(): CategoryCounts {
  try {
    const guardado = localStorage.getItem(CACHE_KEY)
    if (!guardado) return VACIO

    // Se comprueba la forma además de la versión: el JSON pudo quedar a medias
    // o haberlo escrito otra cosa, y la home no puede caerse por eso.
    const leido = JSON.parse(guardado) as CategoryCounts
    const valido = leido && typeof leido.total === 'object' && typeof leido.byLocality === 'object'
    return valido ? leido : VACIO
  } catch {
    return VACIO
  }
}

function guardarCache(counts: CategoryCounts) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(counts))
  } catch {
    // Almacenamiento lleno o bloqueado: vuelve el salto, nada más.
  }
}

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
  // El estado inicial sale de la copia local, no de un objeto vacío: eso es lo
  // que evita el reordenamiento al llegar los datos.
  const [counts, setCounts] = useState<CategoryCounts>(leerCache)

  useEffect(() => {
    return onSnapshot(
      doc(db, 'stats', 'categories'),
      (snap) => {
        const frescos = (snap.data() as CategoryCounts) ?? VACIO
        setCounts(frescos)
        guardarCache(frescos)
      },
      // Un fallo de red no borra lo que ya se estaba mostrando: números un
      // poco viejos son mejores que una grilla que se reacomoda sola.
      () => {},
    )
  }, [])

  const scoped = localityId ? (counts.byLocality[localityId] ?? {}) : counts.total
  return {
    counts: scoped,
    /** true cuando todavía no hay ningún dato de conteo cargado. */
    empty: Object.keys(scoped).length === 0,
  }
}
