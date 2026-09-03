import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import { logger } from 'firebase-functions'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

import { db, FieldValue, notify } from './shared.js'

/** Con qué se reemplaza a quien se fue, donde no se puede borrar sin más. */
const ANONIMO = {
  displayName: 'Usuario eliminado',
  photoURL: null,
}

/** Estados en los que la solicitud sigue viva y el otro está esperando algo. */
const ABIERTAS = ['pending', 'accepted', 'in_progress']

/**
 * Borra la cuenta de quien la pide, con todo lo suyo.
 *
 * Google Play (política de eliminación de datos) y Apple (guía 5.1.1 v)
 * exigen que se pueda hacer desde adentro de la app. Sin esto la app no se
 * publica, por más que todo lo demás funcione.
 *
 * Lo propio se borra; lo que es de a dos se anonimiza. Un chat, una reseña o
 * una solicitud no son solo de quien se va: borrarlos le rompería el historial
 * a la otra persona, que no pidió nada. Así que ahí desaparece la identidad
 * —nombre, foto, cuenta— y queda el hecho.
 */
export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Necesitás iniciar sesión.')

  logger.info(`Borrando la cuenta ${uid}`)

  // 1. Solicitudes abiertas: se cancelan para que del otro lado no quede
  //    nadie esperando una respuesta que ya no puede llegar. El trigger de
  //    `requests` se encarga de avisarle.
  const solicitudes = await db
    .collection('requests')
    .where('participantIds', 'array-contains', uid)
    .get()

  for (const solicitud of solicitudes.docs) {
    if (!ABIERTAS.includes(solicitud.get('status'))) continue

    await solicitud.ref.update({
      status: 'cancelled',
      cancelledBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // El aviso lo manda esta función y no el trigger de `requests`, que no
    // notifica las cancelaciones. Y acá hace falta: del otro lado hay alguien
    // esperando una respuesta que ya no va a llegar, y el motivo no es que se
    // haya arrepentido nadie.
    const participantes: string[] = solicitud.get('participantIds') ?? []
    const otro = participantes.find((participante) => participante !== uid)
    if (!otro) continue

    await notify({
      uid: otro,
      type: 'request_cancelled',
      title: 'Se canceló una solicitud',
      body: `${solicitud.get('title')}. La persona ya no tiene cuenta en Jobo.`,
      link: `/solicitudes/${solicitud.id}`,
    })
  }

  // 2. Reseñas escritas: se anonimiza el autor. La calificación es
  //    información sobre el profesional, no sobre quien la escribió, y
  //    borrarla le cambiaría el promedio a un tercero.
  const escritas = await db.collection('reviews').where('authorId', '==', uid).get()
  for (const resena of escritas.docs) {
    await resena.ref.update({
      authorId: 'deleted',
      authorName: ANONIMO.displayName,
      authorPhotoURL: null,
    })
  }

  // 3. Reseñas recibidas: hablan de un profesional que ya no existe, así que
  //    no le sirven a nadie. Van antes que el perfil, para que el recálculo
  //    del promedio todavía encuentre a quién actualizar.
  const recibidas = await db.collection('reviews').where('professionalId', '==', uid).get()
  for (const resena of recibidas.docs) await resena.ref.delete()

  // 4. Chats: quedan en pie para la otra persona, sin la identidad de quien
  //    se fue. Los mensajes ya escritos no se tocan.
  const chats = await db.collection('chats').where('participantIds', 'array-contains', uid).get()
  for (const chat of chats.docs) {
    await chat.ref.update({
      [`participants.${uid}.displayName`]: ANONIMO.displayName,
      [`participants.${uid}.photoURL`]: null,
    })
  }

  // 5. Denuncias hechas: se conservan sin el denunciante. El caso le sigue
  //    sirviendo a la moderación aunque quien lo abrió ya no esté.
  const denuncias = await db.collection('reports').where('reporterId', '==', uid).get()
  for (const denuncia of denuncias.docs) await denuncia.ref.update({ reporterId: 'deleted' })

  // 6. Lo propio, sin vueltas. El perfil profesional sale de las búsquedas y
  //    su borrado dispara el recálculo de los contadores por rubro.
  const profesional = db.doc(`professionals/${uid}`)
  if ((await profesional.get()).exists) await profesional.delete()

  // `recursiveDelete` se lleva también las subcolecciones: los avisos y los
  // favoritos, que de otro modo quedarían huérfanos e invisibles.
  await db.recursiveDelete(db.doc(`users/${uid}`))

  // 7. Fotos de perfil y de trabajos. Las de solicitudes y chats viven fuera
  //    de este prefijo y quedan, como los mensajes: son parte de una
  //    conversación de a dos.
  await getStorage()
    .bucket()
    .deleteFiles({ prefix: `users/${uid}/` })

  // 8. Por último la cuenta de Auth. Va al final a propósito: si algo falla
  //    antes, la persona sigue pudiendo entrar y volver a intentarlo, en vez
  //    de quedarse sin cuenta y con los datos a medio borrar.
  await getAuth().deleteUser(uid)

  logger.info(`Cuenta ${uid} borrada`, {
    solicitudes: solicitudes.size,
    resenasEscritas: escritas.size,
    resenasRecibidas: recibidas.size,
    chats: chats.size,
    denuncias: denuncias.size,
  })

  return { ok: true }
})
