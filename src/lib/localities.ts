import type { Locality, LocalityRef } from '@/types/models'

/**
 * Catálogo de localidades de todo el país: las 4037 que publica la API Georef
 * del Estado (INDEC, IGN y BAHRA). Lo regenera `scripts/fetch-localities.mjs`.
 *
 * Se carga aparte del bundle a propósito: son ~80 KB comprimidos que no hacen
 * falta para abrir la app, solo para elegir o adivinar un pueblo. `load()`
 * guarda la promesa, así que aunque tres pantallas lo pidan a la vez se baja
 * una sola vez.
 */
interface CompactCatalog {
  provinces: string[]
  /** [id, nombre, índice de provincia, lat, lng] */
  localities: [string, string, number, number, number][]
}

let pending: Promise<Locality[]> | null = null
let loaded: Locality[] | null = null

export function loadLocalities(): Promise<Locality[]> {
  if (loaded) return Promise.resolve(loaded)

  pending ??= import('./data/localities.json').then((mod) => {
    const data = mod.default as CompactCatalog
    const list: Locality[] = data.localities.map(([id, name, province, lat, lng]) => ({
      id,
      name,
      province: data.provinces[province] ?? '',
      lat,
      lng,
    }))
    loaded = list
    return list
  })

  return pending
}

/** El catálogo si ya está en memoria; null si todavía no se pidió. */
export function localitiesIfLoaded() {
  return loaded
}

export function toLocalityRef(locality: Locality): LocalityRef {
  return { id: locality.id, name: locality.name, province: locality.province }
}

/**
 * Busca por nombre, tolerante a acentos y mayúsculas. Con 4000 localidades no
 * se puede mostrar la lista entera: la pantalla pide de a un puñado.
 */
export function searchLocalities(catalog: Locality[], term: string, max = 30) {
  const needle = normalize(term.trim())
  if (!needle) return catalog.slice(0, max)

  const starts: Locality[] = []
  const contains: Locality[] = []

  for (const locality of catalog) {
    const name = normalize(locality.name)
    // Lo que empieza con lo tecleado va primero: escribir "cor" tiene que
    // traer Córdoba antes que Las Corzuelas.
    if (name.startsWith(needle)) starts.push(locality)
    else if (name.includes(needle)) contains.push(locality)
    if (starts.length >= max) break
  }

  return [...starts, ...contains].slice(0, max)
}

export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Distancia aproximada en km entre dos puntos (fórmula del haversine). */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Pide la ubicación al navegador y devuelve la localidad más cercana del
 * catálogo. Nunca guardamos las coordenadas: solo se usan acá para adivinar
 * el pueblo, y el usuario siempre puede corregirlo a mano.
 */
export function detectLocality(maxKm = 60): Promise<Locality | null> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu dispositivo no permite detectar la ubicación.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        loadLocalities()
          .then((catalog) => {
            let best: Locality | null = null
            let bestKm = Infinity

            for (const locality of catalog) {
              const km = distanceKm(coords.latitude, coords.longitude, locality.lat, locality.lng)
              if (km < bestKm) {
                bestKm = km
                best = locality
              }
            }

            resolve(bestKm <= maxKm ? best : null)
          })
          .catch(() => reject(new Error('No pudimos cargar el listado de localidades.')))
      },
      () => reject(new Error('No pudimos acceder a tu ubicación. Elegí tu localidad a mano.')),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  })
}
