import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'

import { db, FieldValue, notify } from './shared.js'

/** Solicitud nueva: le avisamos al profesional. */
export const onRequestCreated = onDocumentCreated('requests/{requestId}', async (event) => {
  const request = event.data?.data()
  if (!request) return

  const client = await db.doc(`users/${request.clientId}`).get()

  await notify({
    uid: request.professionalId,
    type: 'request_received',
    title: 'Nueva solicitud',
    body: `${client.get('displayName') ?? 'Alguien'} te pidió un presupuesto: ${request.title}`,
    link: `/solicitudes/${event.params.requestId}`,
  })
})

/**
 * Cambios de estado: avisa a la otra parte y, cuando el trabajo se completa,
 * suma el trabajo al contador del profesional.
 */
export const onRequestUpdated = onDocumentUpdated('requests/{requestId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!before || !after || before.status === after.status) return

  const requestId = event.params.requestId
  const link = `/solicitudes/${requestId}`

  const messages: Partial<Record<string, { uid: string; type: Parameters<typeof notify>[0]['type']; title: string; body: string }>> = {
    accepted: {
      uid: after.clientId,
      type: 'request_accepted',
      title: 'Aceptaron tu solicitud',
      body: `Ya podés coordinar por chat: ${after.title}`,
    },
    rejected: {
      uid: after.clientId,
      type: 'request_rejected',
      title: 'Rechazaron tu solicitud',
      body: `${after.title}. Probá con otro profesional de tu zona.`,
    },
    completed: {
      uid: after.clientId,
      type: 'request_completed',
      title: '¿Cómo salió el trabajo?',
      body: `Calificá a quien te ayudó con: ${after.title}`,
    },
  }

  const message = messages[after.status]
  if (message) {
    await notify({ ...message, link: after.status === 'completed' ? `${link}/resena` : link })
  }

  if (after.status === 'completed') {
    await db.doc(`professionals/${after.professionalId}`).update({
      completedJobs: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  // Tiempo de respuesta: cuánto tardó el profesional en aceptar o rechazar.
  if (before.status === 'pending' && ['accepted', 'rejected'].includes(after.status)) {
    const createdAt = after.createdAt?.toMillis?.()
    if (createdAt) {
      const elapsed = Date.now() - createdAt
      const proRef = db.doc(`professionals/${after.professionalId}`)
      const pro = await proRef.get()
      const previous: number | null = pro.get('avgResponseMs') ?? null
      const answered: number = pro.get('answeredRequests') ?? 0

      await proRef.update({
        // Media móvil: evita releer todas las solicitudes en cada respuesta.
        avgResponseMs:
          previous === null ? elapsed : Math.round((previous * answered + elapsed) / (answered + 1)),
        answeredRequests: FieldValue.increment(1),
      })
    }
  }
})
