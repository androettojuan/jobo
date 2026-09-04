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
  | 'request_cancelled'
  | 'message_received'
  | 'review_received'
  | 'report_received'

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

const DEAD = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
])

type Platform = 'web' | 'android' | 'ios'

interface Device {
  token: string
  platform: Platform
  /**
   * La entrada tal como está guardada en Firestore. `arrayRemove` compara por
   * valor exacto: para sacar un token muerto hay que devolverle la misma forma
   * que tiene guardada, que no siempre es la nueva.
   */
  raw: unknown
}

/**
 * Lee `users/{uid}.fcmTokens`, que puede venir en dos formas.
 *
 * La vieja es un array de strings, de cuando la app existía solo en la web.
 * La nueva guarda `{ token, platform }`, porque el mensaje que hay que armar
 * es distinto en cada plataforma. Las dos conviven mientras queden clientes
 * sin actualizar; `scripts/backfill-fcm-tokens.mjs` migra las guardadas.
 *
 * Se descartan los tokens repetidos: un navegador que ya estaba registrado
 * antes del cambio vuelve a guardarse con la forma nueva, y queda el mismo
 * token dos veces. Sin esto, ese teléfono recibiría cada aviso duplicado.
 */
function readDevices(value: unknown): Device[] {
  if (!Array.isArray(value)) return []

  const vistos = new Set<string>()

  return value.flatMap((entry): Device[] => {
    let token: unknown
    let platform: unknown = 'web'

    if (typeof entry === 'string') {
      token = entry
    } else if (entry && typeof entry === 'object' && 'token' in entry) {
      ;({ token, platform } = entry as { token?: unknown; platform?: unknown })
    }

    if (typeof token !== 'string' || token === '' || vistos.has(token)) return []
    vistos.add(token)

    const known = platform === 'android' || platform === 'ios' ? platform : 'web'
    return [{ token, platform: known, raw: entry }]
  })
}

/**
 * La parte del mensaje que cambia según de dónde salió el token.
 *
 * En la web va solo `data`: si llevara `notification`, el SDK dibujaría su
 * propio aviso además del que dibuja el service worker y se verían dos. En
 * Android y iOS es al revés —sin `notification` el sistema no muestra nada con
 * la app cerrada—, y ahí no hay service worker que duplique nada.
 */
function platformMessage(platform: Platform, title: string, body: string, link: string) {
  if (platform === 'web') {
    return {
      webpush: {
        // Sin urgencia alta, Android puede demorar o directamente descartar el
        // aviso cuando el navegador está en segundo plano y el ahorro de
        // batería aprieta. Para un chat, un aviso que llega mañana no sirve.
        headers: { Urgency: 'high', TTL: '86400' },
        fcmOptions: { link: `${APP_URL}${link}` },
      },
    }
  }

  if (platform === 'android') {
    return {
      notification: { title, body },
      android: {
        priority: 'high' as const,
        ttl: 86_400_000,
        notification: {
          // Un aviso por conversación: el nuevo reemplaza al anterior del
          // mismo hilo, igual que hace el service worker en la web.
          tag: link,
          icon: 'ic_stat_jobo',
          color: '#09bc8a',
        },
      },
    }
  }

  return {
    notification: { title, body },
    apns: {
      // 10 es "mostrar ya". Con 5, iOS puede juntar el aviso con otros y
      // demorarlo para ahorrar batería.
      headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
      payload: { aps: { sound: 'default', 'thread-id': link } },
    },
  }
}

/**
 * Deja la notificación en `users/{uid}/notifications` (historial dentro de la
 * app) y además la manda por push a todos los dispositivos registrados.
 * Los tokens que el servicio reporta como inválidos se limpian.
 */
export async function notify({ uid, type, title, body, link, groupKey, inApp }: NotifyParams) {
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
  const devices = readDevices(snap.get('fcmTokens'))
  if (devices.length === 0) {
    console.log(`push ${type} para ${uid}: sin dispositivos registrados`)
    return
  }

  const data = { title, body, link, type }

  // Un envío por plataforma: el mismo aviso necesita un mensaje distinto en
  // cada una, y `sendEachForMulticast` manda un solo mensaje a muchos tokens.
  const byPlatform = new Map<Platform, Device[]>()
  for (const device of devices) {
    const group = byPlatform.get(device.platform)
    if (group) group.push(device)
    else byPlatform.set(device.platform, [device])
  }

  const stale: unknown[] = []
  let delivered = 0
  const errors: string[] = []

  for (const [plataforma, group] of byPlatform) {
    const response = await messaging.sendEachForMulticast({
      tokens: group.map((device) => device.token),
      data,
      ...platformMessage(plataforma, title, body, link),
    })

    delivered += response.successCount
    response.responses.forEach((result, index) => {
      const device = group[index]
      if (result.success || !device) return
      errors.push(`${plataforma} ${device.token.slice(0, 12)}…: ${result.error?.code}`)
      // Solo se descartan los tokens que el servicio marca como muertos; un
      // fallo transitorio de red no debería desregistrar el dispositivo.
      if (DEAD.has(result.error?.code ?? '')) stale.push(device.raw)
    })
  }

  // Sin esto, un push que no llega no deja rastro en ningún lado: la función
  // termina "bien" y el aviso se pierde en silencio.
  console.log(
    `push ${type} para ${uid}: ${delivered}/${devices.length} entregados`,
    errors.join(' | '),
  )

  if (stale.length > 0) {
    await userRef.update({ fcmTokens: FieldValue.arrayRemove(...stale) })
  }
}
