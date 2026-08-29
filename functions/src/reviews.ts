import { onDocumentWritten } from 'firebase-functions/v2/firestore'

import { db, FieldValue, notify } from './shared.js'

/**
 * Recalcula el promedio del profesional cada vez que se crea, edita o borra
 * una reseña. Se recorre la colección en lugar de sumar incrementalmente
 * porque el volumen por profesional es chico y así el número nunca se
 * desincroniza si una escritura se pierde.
 */
export const onReviewWritten = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  const professionalId = after?.professionalId ?? before?.professionalId
  if (!professionalId) return

  const snap = await db
    .collection('reviews')
    .where('professionalId', '==', professionalId)
    .where('hidden', '==', false)
    .get()

  const ratings = snap.docs.map((doc) => doc.get('rating') as number)
  const ratingCount = ratings.length
  const ratingAvg =
    ratingCount === 0 ? 0 : Math.round((ratings.reduce((a, b) => a + b, 0) / ratingCount) * 10) / 10

  await db.doc(`professionals/${professionalId}`).update({
    ratingAvg,
    ratingCount,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Avisamos solo cuando la reseña es nueva, no en cada edición.
  if (!before && after) {
    await notify({
      uid: professionalId,
      type: 'review_received',
      title: `${after.authorName} te calificó`,
      body: `${after.rating} ${after.rating === 1 ? 'estrella' : 'estrellas'}. ${after.comment ?? ''}`.trim(),
      link: `/profesional/${professionalId}`,
    })
  }
})
