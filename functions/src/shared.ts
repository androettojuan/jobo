import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

if (getApps().length === 0) initializeApp()

export const db = getFirestore()
export const messaging = getMessaging()
export { FieldValue }

/**
 * Dominio público de la app. `webpush.fcmOptions.link` exige una URL absoluta
 * con HTTPS: con una ruta relativa el envío se acepta igual, pero el navegador
 * puede descartar el aviso sin avisar a nadie.
 */
const APP_URL = 'https://jobo-8b688.web.app'

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
  /**
   * Agrupa el historial dentro de la app: con la misma clave, el aviso nuevo
   * reemplaza al anterior en vez de acumular una entrada por evento. Los push
   * al teléfono se mandan igual, uno por evento.
   */
  groupKey?: string
  /** Texto del historial cuando conviene que diga algo distinto al push. */
  inApp?: { title: string; body: string }
}

/**
 * Deja la notificación en `users/{uid}/notifications` (historial dentro de la
 * app) y además la manda por push a todos los dispositivos registrados.
 * Los tokens que el servicio reporta como inválidos se limpian.
 */
export async function notify({
  uid,
  type,
  title,
  body,
  link,
  groupKey,
  inApp,
}: NotifyParams) {
  const userRef = db.doc(`users/${uid}`)

  const entry = {
    type,
    title: inApp?.title ?? title,
    body: inApp?.body ?? body,
    link,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  }

  const notifications = userRef.collection('notifications')
  if (groupKey) {
    await notifications.doc(groupKey).set(entry)
  } else {
    await notifications.add(entry)
  }

  const snap = await userRef.get()
  const tokens: string[] = snap.get('fcmTokens') ?? []
  if (tokens.length === 0) return

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { link, type },
    webpush: {
      fcmOptions: { link: `${APP_URL}${link}` },
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
