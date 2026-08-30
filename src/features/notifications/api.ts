import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore'
import type { FirestoreError } from 'firebase/firestore'

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

/**
 * El `onError` es obligatorio a propósito: sin él, un fallo del listener deja
 * la pantalla en el spinner para siempre y sin explicación.
 */
export function subscribeToNotifications(
  uid: string,
  onChange: (notifications: AppNotification[]) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification)),
    onError,
  )
}

export function markNotificationRead(uid: string, notificationId: string) {
  return updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true })
}

/** Tope de operaciones por lote que admite Firestore. */
const BATCH_LIMIT = 500

/**
 * Vacía el historial de avisos. Consulta la colección en vez de borrar solo lo
 * que la pantalla tiene a la vista (que llega hasta 50): si no, al usuario con
 * más avisos la lista se le vuelve a llenar sola apenas termina.
 */
export async function clearNotifications(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'notifications'))

  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const found of snap.docs.slice(i, i + BATCH_LIMIT)) batch.delete(found.ref)
    await batch.commit()
  }
}
