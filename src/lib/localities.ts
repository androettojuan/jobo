import type { Locality, LocalityRef } from '@/types/models'

/**
 * Catálogo de localidades. Arrancamos por el Valle de Calamuchita y se va
 * ampliando: agregar una localidad acá (y correr el seed) alcanza para que
 * aparezca en los filtros.
 */
export const LOCALITIES: Locality[] = [
  { id: 'villa-rumipal', name: 'Villa Rumipal', province: 'Córdoba', lat: -32.1889, lng: -64.4767 },
  { id: 'embalse', name: 'Embalse', province: 'Córdoba', lat: -32.2069, lng: -64.4036 },
  { id: 'villa-del-dique', name: 'Villa del Dique', province: 'Córdoba', lat: -32.1806, lng: -64.4531 },
  { id: 'santa-rosa-de-calamuchita', name: 'Santa Rosa de Calamuchita', province: 'Córdoba', lat: -32.0672, lng: -64.5386 },
  { id: 'villa-general-belgrano', name: 'Villa General Belgrano', province: 'Córdoba', lat: -31.9781, lng: -64.5556 },
  { id: 'los-reartes', name: 'Los Reartes', province: 'Córdoba', lat: -31.9036, lng: -64.5722 },
  { id: 'la-cruz', name: 'La Cruz', province: 'Córdoba', lat: -32.1156, lng: -64.4869 },
  { id: 'san-agustin', name: 'San Agustín', province: 'Córdoba', lat: -31.9333, lng: -64.3667 },
]

export const LOCALITIES_BY_ID = new Map(LOCALITIES.map((l) => [l.id, l]))

export function toLocalityRef(locality: Locality): LocalityRef {
  return { id: locality.id, name: locality.name, province: locality.province }
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
        let best: Locality | null = null
        let bestKm = Infinity

        for (const locality of LOCALITIES) {
          const km = distanceKm(coords.latitude, coords.longitude, locality.lat, locality.lng)
          if (km < bestKm) {
            bestKm = km
            best = locality
          }
        }

        resolve(bestKm <= maxKm ? best : null)
      },
      () => reject(new Error('No pudimos acceder a tu ubicación. Elegí tu localidad a mano.')),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  })
}
