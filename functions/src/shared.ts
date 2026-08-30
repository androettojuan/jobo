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
  if (tokens.length === 0) {
    console.log(`push ${type} para ${uid}: sin dispositivos registrados`)
    return
  }

  // Solo `data`, sin bloque `notification`: cuando el push trae `notification`
  // el SDK lo muestra por su cuenta y el service worker lo muestra otra vez,
  // y el aviso llega duplicado. Así lo dibuja un solo lado.
  const response = await messaging.sendEachForMulticast({
    tokens,
    data: { title, body, link, type },
    webpush: {
      // Sin urgencia alta, Android puede demorar o directamente descartar el
      // aviso cuando el navegador está en segundo plano y el ahorro de batería
      // aprieta. Para un chat, un aviso que llega mañana no sirve de nada.
      headers: { Urgency: 'high', TTL: '86400' },
      fcmOptions: { link: `${APP_URL}${link}` },
    },
  })

  // Solo se descartan los tokens que el servicio marca como muertos; un fallo
  // transitorio de red no debería desregistrar el dispositivo.
  const DEAD = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
  ])

  // Sin esto, un push que no llega no deja rastro en ningún lado: la función
  // termina "bien" y el aviso se pierde en silencio.
  console.log(
    `push ${type} para ${uid}: ${response.successCount}/${tokens.length} entregados`,
    response.responses
      .map((r, i) => (r.success ? null : `token ${i + 1}: ${r.error?.code}`))
      .filter(Boolean)
      .join(' | '),
  )

  const stale = response.responses.flatMap((result, index) => {
    const token = tokens[index]
    if (result.success || !token) return []
    return DEAD.has(result.error?.code ?? '') ? [token] : []
  })

  if (stale.length > 0) {
    await userRef.update({ fcmTokens: FieldValue.arrayRemove(...stale) })
  }
}
