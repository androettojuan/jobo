import { isNative } from '@/lib/platform'
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

/** Error que la pantalla muestra tal cual cuando no se pudo ubicar a nadie. */
const SIN_UBICACION = 'No pudimos acceder a tu ubicación. Elegí tu localidad a mano.'

/**
 * Las coordenadas del dispositivo, por el camino que corresponda.
 *
 * En la web las pide el navegador. Adentro del contenedor nativo hace falta el
 * plugin: `navigator.geolocation` existe en el WebView, pero el permiso lo
 * concede el sistema operativo, no la página, y sin plugin nadie lo pide.
 */
async function getCoords() {
  if (isNative) {
    const { Geolocation } = await import('@capacitor/geolocation')
    // Alcanza la ubicación aproximada: solo se usa para adivinar el pueblo, y
    // pedir la precisa obliga a justificarla ante Google Play.
    const { coords } = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60_000,
    })
    return coords
  }

  if (!('geolocation' in navigator)) {
    throw new Error('Tu dispositivo no permite detectar la ubicación.')
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10_000,
      maximumAge: 5 * 60_000,
    }),
  )
  return position.coords
}

/**
 * Pide la ubicación al dispositivo y devuelve la localidad más cercana del
 * catálogo. Nunca guardamos las coordenadas: solo se usan acá para adivinar
 * el pueblo, y el usuario siempre puede corregirlo a mano.
 */
export async function detectLocality(maxKm = 60): Promise<Locality | null> {
  let coords: { latitude: number; longitude: number }
  try {
    coords = await getCoords()
  } catch (cause) {
    // El mensaje del navegador o del plugin no le dice nada a nadie; lo que
    // importa es que se puede seguir eligiendo el pueblo a mano.
    throw new Error(SIN_UBICACION, { cause })
  }

  const catalog = await loadLocalities().catch(() => {
    throw new Error('No pudimos cargar el listado de localidades.')
  })

  let best: Locality | null = null
  let bestKm = Infinity

  for (const locality of catalog) {
    const km = distanceKm(coords.latitude, coords.longitude, locality.lat, locality.lng)
    if (km < bestKm) {
      bestKm = km
      best = locality
    }
  }

  return bestKm <= maxKm ? best : null
}
