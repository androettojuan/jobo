import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import { db } from './shared.js'

/**
 * Recalcula `stats/categories`: cuántos profesionales activos hay por
 * categoría, en total y por localidad. Es lo que el home usa para mostrar
 * "3 disponibles" o "sin nadie aún".
 */
async function recalculateCategoryStats() {
  const snap = await db.collection('professionals').where('status', '==', 'active').get()

  const total: Record<string, number> = {}
  const byLocality: Record<string, Record<string, number>> = {}

  for (const doc of snap.docs) {
    const categoryIds: string[] = doc.get('categoryIds') ?? []
    const serviceAreaIds: string[] = doc.get('serviceAreaIds') ?? []

    for (const categoryId of categoryIds) {
      total[categoryId] = (total[categoryId] ?? 0) + 1

      for (const localityId of serviceAreaIds) {
        byLocality[localityId] ??= {}
        byLocality[localityId][categoryId] = (byLocality[localityId][categoryId] ?? 0) + 1
      }
    }
  }

  await db.doc('stats/categories').set({ total, byLocality, updatedAt: new Date() })
}

/** Cada alta, baja o edición de perfil profesional refresca los contadores. */
export const onProfessionalWritten = onDocumentWritten('professionals/{uid}', async () => {
  await recalculateCategoryStats()
})

/** Red de seguridad: si alguna escritura se perdió, a la madrugada se corrige. */
export const refreshStatsDaily = onSchedule(
  { schedule: 'every day 04:00', timeZone: 'America/Argentina/Cordoba' },
  async () => {
    await recalculateCategoryStats()
  },
)
