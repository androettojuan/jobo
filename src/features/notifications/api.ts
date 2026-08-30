import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore'

import { app, db } from '@/lib/firebase'
import type { AppNotification } from '@/types/models'

/** Por qué no se pudo registrar el dispositivo, para poder decirlo en pantalla. */
export type PushFailure = 'unsupported' | 'denied' | 'no-vapid-key' | 'failed'

export class PushError extends Error {
  reason: PushFailure

  constructor(reason: PushFailure, options?: ErrorOptions) {
    super(reason, options)
    this.name = 'PushError'
    this.reason = reason
  }
}

/**
 * Pide permiso de notificaciones y registra el token del dispositivo.
 * Devuelve el token, o lanza `PushError` con el motivo: sin permiso es muy
 * distinto de un fallo técnico y la pantalla tiene que poder diferenciarlos.
 */
export async function enablePushNotifications(uid: string) {
  if (!(await isSupported())) throw new PushError('unsupported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushError('denied')

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) throw new PushError('no-vapid-key')

  let token: string | null = null
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    })
    await navigator.serviceWorker.ready

    token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration })
  } catch (cause) {
    throw new PushError('failed', { cause })
  }
  if (!token) throw new PushError('failed')

  await updateDoc(doc(db, 'users', uid), {
    fcmTokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  })

  return token
}

/** Mensajes que llegan con la app abierta: no los muestra el sistema. */
export async function onForegroundMessage(handler: (title: string, body: string) => void) {
  if (!(await isSupported())) return () => {}

  return onMessage(getMessaging(app), (payload) => {
    handler(payload.notification?.title ?? 'Jobo', payload.notification?.body ?? '')
  })
}

export function subscribeToNotifications(
  uid: string,
  onChange: (notifications: AppNotification[]) => void,
) {
  return onSnapshot(
    query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification)),
  )
}

export function markNotificationRead(uid: string, notificationId: string) {
  return updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true })
}

/** Borra el historial de avisos del usuario. Los ids son los que tiene a la vista. */
export async function clearNotifications(uid: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return

  const batch = writeBatch(db)
  for (const id of notificationIds) {
    batch.delete(doc(db, 'users', uid, 'notifications', id))
  }
  await batch.commit()
}
