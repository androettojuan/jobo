import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { getAuth } from 'firebase-admin/auth'

import { db } from './shared.js'

/**
 * Cuando un admin aprueba una categoría propuesta, la volvemos visible.
 * Si en cambio la unifica con otra (`mergedInto`), reasignamos los perfiles
 * que la tenían para que no queden apuntando a un slug muerto.
 */
export const onCategoryUpdated = onDocumentUpdated('categories/{categoryId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!before || !after) return

  const categoryId = event.params.categoryId

  if (after.mergedInto && after.mergedInto !== before.mergedInto) {
    const affected = await db
      .collection('professionals')
      .where('categoryIds', 'array-contains', categoryId)
      .get()

    const batch = db.batch()
    for (const doc of affected.docs) {
      const categoryIds: string[] = doc.get('categoryIds') ?? []
      const next = [...new Set(categoryIds.map((id) => (id === categoryId ? after.mergedInto : id)))]
      batch.update(doc.ref, { categoryIds: next })
    }
    await batch.commit()

    logger.info(`Categoría ${categoryId} unificada en ${after.mergedInto}`, {
      profiles: affected.size,
    })
  }
})

/** Suspender a alguien en Firestore también le corta el acceso a Auth. */
export const onUserDisabledChanged = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.get('disabled')
  const after = event.data?.after.get('disabled')
  if (before === after) return

  await getAuth().updateUser(event.params.uid, { disabled: after === true })
  if (after === true) {
    await getAuth().revokeRefreshTokens(event.params.uid)
    // Y lo sacamos de las búsquedas.
    const pro = db.doc(`professionals/${event.params.uid}`)
    if ((await pro.get()).exists) await pro.update({ status: 'paused' })
  }
})

/** Aviso al admin de que hay una denuncia nueva (queda en los logs y en el panel). */
export const onReportCreated = onDocumentCreated('reports/{reportId}', async (event) => {
  const report = event.data?.data()
  logger.info('Denuncia nueva', {
    reportId: event.params.reportId,
    targetType: report?.targetType,
    reason: report?.reason,
  })
})
