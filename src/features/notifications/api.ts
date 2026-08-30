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

/** El service worker que atiende los push, si está registrado. */
export function getMessagingRegistration() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(undefined)
  return navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope')
}

/** Token actual de este dispositivo, sin registrarlo ni pedir permisos. */
export async function getCurrentToken() {
  if (!(await isSupported())) return null
  const registration = await getMessagingRegistration()
  if (!registration) return null

  return getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
}

/**
 * Muestra un aviso del sistema desde la propia página, para los push que
 * Firebase entrega a la app en vez de mostrarlos él. Pasa cuando la app sigue
 * viva en segundo plano: no está en pantalla, pero tampoco cerrada.
 */
export async function showSystemNotification(title: string, body: string, link: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false

  const registration = await navigator.serviceWorker.getRegistration(
    '/firebase-cloud-messaging-push-scope',
  )
  if (!registration) return false

  await registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { link },
  })
  return true
}

/**
 * Muestra un aviso generado por el propio dispositivo, sin pasar por la red.
 * Sirve para separar dos problemas que se ven igual: que el teléfono tenga
 * los avisos apagados a nivel sistema, o que el push no esté llegando.
 */
export async function showTestNotification() {
  if (typeof Notification === 'undefined') throw new PushError('unsupported')
  if (Notification.permission !== 'granted') throw new PushError('denied')

  const registration = await navigator.serviceWorker.getRegistration(
    '/firebase-cloud-messaging-push-scope',
  )
  if (!registration) throw new PushError('failed')

  await registration.showNotification('Jobo', {
    body: 'Prueba: si ves este aviso, tu teléfono los muestra bien.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'jobo-prueba',
  })
}

/** Mensajes que llegan con la app abierta: no los muestra el sistema. */
export async function onForegroundMessage(
  handler: (title: string, body: string, link: string) => void,
) {
  if (!(await isSupported())) return () => {}

  return onMessage(getMessaging(app), (payload) => {
    // El servidor manda todo en `data`, para no duplicar el aviso.
    handler(
      payload.data?.title ?? payload.notification?.title ?? 'Jobo',
      payload.data?.body ?? payload.notification?.body ?? '',
      payload.data?.link ?? '/notificaciones',
    )
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
