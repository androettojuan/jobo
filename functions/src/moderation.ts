import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'
import { getAuth } from 'firebase-admin/auth'

import { db, notify } from './shared.js'

/** Los mismos motivos que ofrece la pantalla de denuncia, en texto. */
const MOTIVOS: Record<string, string> = {
  fraud: 'Me quiso estafar',
  abuse: 'Me trató mal',
  fake_profile: 'El perfil es falso',
  no_show: 'No se presentó',
  spam: 'Manda spam',
  other: 'Otro motivo',
}

const OBJETOS: Record<string, string> = {
  user: 'una persona',
  professional: 'un perfil profesional',
  review: 'una reseña',
  message: 'un mensaje',
}

/**
 * Los uid con el custom claim de admin.
 *
 * Se recorre Auth porque el rol vive en el token y no en Firestore —esa fue la
 * decisión, para que nadie pueda dárselo a sí mismo editando su documento—, y
 * un custom claim no se puede consultar. No se cachea a propósito: las
 * denuncias son pocas, y una lista vieja significa que un admin nuevo no se
 * entera de nada. Si algún día llegan seguido, esto hay que resolverlo de otra
 * forma.
 */
async function adminUids() {
  const admins: string[] = []
  let pageToken: string | undefined

  do {
    const page = await getAuth().listUsers(1000, pageToken)
    for (const user of page.users) {
      if (user.customClaims?.admin === true) admins.push(user.uid)
    }
    pageToken = page.pageToken
  } while (pageToken)

  return admins
}

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

/**
 * Le avisa al admin que entró una denuncia.
 *
 * Los términos prometen mirar cada denuncia dentro de las 24 horas, y la guía
 * 1.2 de la App Store pide demostrar que se actúa sobre ellas. Con el aviso
 * solo en los logs, eso dependía de que alguien se acordara de mirar el panel.
 *
 * Va por el mismo camino que el resto de los avisos: entrada en el historial y
 * push al teléfono, sin sumar ningún servicio de correo.
 */
export const onReportCreated = onDocumentCreated('reports/{reportId}', async (event) => {
  const report = event.data?.data()
  const reportId = event.params.reportId

  logger.info('Denuncia nueva', {
    reportId,
    targetType: report?.targetType,
    reason: report?.reason,
  })
  if (!report) return

  // Copia del mensaje denunciado, para que el admin pueda verlo sin que se le
  // abra la conversación entera. La escribe esta función leyendo el mensaje
  // real: si la mandara el cliente, cualquiera podría inventar la prueba con
  // la que acusa a otro.
  if (report.targetType === 'message' && report.chatId) {
    const mensaje = await db.doc(`chats/${report.chatId}/messages/${report.targetId}`).get()
    await event.data?.ref.update({
      reportedMessage: mensaje.exists
        ? {
            text: mensaje.get('text') ?? '',
            imageUrl: mensaje.get('imageUrl') ?? null,
            senderId: mensaje.get('senderId') ?? '',
          }
        : null,
    })
    if (!mensaje.exists) logger.warn(`Denuncia ${reportId}: el mensaje ya no está`)
  }

  const objeto = OBJETOS[report.targetType] ?? 'algo'
  const motivo = MOTIVOS[report.reason] ?? 'Otro motivo'

  const admins = await adminUids()
  if (admins.length === 0) {
    // Que no haya a quién avisarle es un problema de configuración, no del
    // código: sin esto en los logs, las denuncias se acumulan en silencio.
    logger.warn(`Denuncia ${reportId} sin admin a quien avisar`)
    return
  }

  for (const uid of admins) {
    // Si el admin es quien denunció, ya lo sabe.
    if (uid === report.reporterId) continue

    await notify({
      uid,
      type: 'report_received',
      title: `Denunciaron ${objeto}`,
      body: `${motivo}. ${report.details ? `"${report.details}"` : 'Sin más detalle.'}`.trim(),
      link: '/admin',
    })
  }
})

/**
 * Mantiene sincronizado el perfil profesional con el perfil base: nombre,
 * foto y el teléfono (solo si la persona eligió mostrarlo). Sin esto, quien
 * cambia su nombre queda con el viejo en las búsquedas, y la ficha pública
 * no tendría forma de leer el teléfono, porque `users/{uid}` exige sesión.
 */
export const onUserProfileChanged = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before
  const after = event.data?.after
  if (!before || !after) return

  const changed =
    before.get('displayName') !== after.get('displayName') ||
    before.get('photoURL') !== after.get('photoURL') ||
    before.get('phone') !== after.get('phone') ||
    before.get('phoneIsPublic') !== after.get('phoneIsPublic')

  if (!changed) return

  const professional = db.doc(`professionals/${event.params.uid}`)
  if (!(await professional.get()).exists) return

  await professional.update({
    displayName: after.get('displayName') ?? '',
    photoURL: after.get('photoURL') ?? null,
    publicPhone: after.get('phoneIsPublic') === true ? (after.get('phone') ?? null) : null,
  })
})
