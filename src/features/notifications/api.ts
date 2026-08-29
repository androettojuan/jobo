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
  arrayUnion,
} from 'firebase/firestore'

import { app, db } from '@/lib/firebase'
import type { AppNotification } from '@/types/models'

/**
 * Pide permiso de notificaciones y registra el token del dispositivo.
 * Devuelve el token, o null si el usuario no dio permiso o el navegador no
 * soporta push (iOS solo lo permite con la PWA instalada).
 */
export async function enablePushNotifications(uid: string) {
  if (!(await isSupported())) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/firebase-cloud-messaging-push-scope',
  })

  const token = await getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
  if (!token) return null

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
