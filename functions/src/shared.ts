import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

if (getApps().length === 0) initializeApp()

export const db = getFirestore()
export const messaging = getMessaging()
export { FieldValue }

export type NotificationType =
  | 'request_received'
  | 'request_accepted'
  | 'request_rejected'
  | 'request_completed'
  | 'message_received'
  | 'review_received'

interface NotifyParams {
  uid: string
  type: NotificationType
  title: string
  body: string
  /** Ruta interna a la que lleva el tap. */
  link: string
}

/**
 * Deja la notificación en `users/{uid}/notifications` (historial dentro de la
 * app) y además la manda por push a todos los dispositivos registrados.
 * Los tokens que el servicio reporta como inválidos se limpian.
 */
export async function notify({ uid, type, title, body, link }: NotifyParams) {
  const userRef = db.doc(`users/${uid}`)

  await userRef.collection('notifications').add({
    type,
    title,
    body,
    link,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  })

  const snap = await userRef.get()
  const tokens: string[] = snap.get('fcmTokens') ?? []
  if (tokens.length === 0) return

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { link, type },
    webpush: {
      fcmOptions: { link },
      notification: { icon: '/pwa-192x192.png' },
    },
  })

  // Solo se descartan los tokens que el servicio marca como muertos; un fallo
  // transitorio de red no debería desregistrar el dispositivo.
  const DEAD = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
  ])

  const stale = response.responses.flatMap((result, index) => {
    const token = tokens[index]
    if (result.success || !token) return []
    return DEAD.has(result.error?.code ?? '') ? [token] : []
  })

  if (stale.length > 0) {
    await userRef.update({ fcmTokens: FieldValue.arrayRemove(...stale) })
  }
}
