import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { LocalNotifications } from '@capacitor/local-notifications'

/**
 * Push adentro del contenedor nativo. En la web todo esto lo hace el service
 * worker (`public/firebase-messaging-sw.js`); acá lo hace el sistema
 * operativo, así que el camino es otro aunque el resultado se vea igual.
 */

/** Pide permiso y devuelve el token de este dispositivo, o `null` si lo negaron. */
export async function requestNativeToken() {
  // En Android hasta la 12 el permiso no existe y `requestPermissions` ya
  // devuelve `granted`; desde la 13 abre el diálogo del sistema.
  const { receive } = await FirebaseMessaging.requestPermissions()
  if (receive !== 'granted') return null

  const { token } = await FirebaseMessaging.getToken()
  return token || null
}

/** El permiso del sistema, tal como está ahora. Para el panel de diagnóstico. */
export async function nativePermission() {
  const { receive } = await FirebaseMessaging.checkPermissions()
  return receive
}

/** Token actual, sin pedir permisos ni abrir ningún diálogo. */
export async function currentNativeToken() {
  const { receive } = await FirebaseMessaging.checkPermissions()
  if (receive !== 'granted') return null

  const { token } = await FirebaseMessaging.getToken()
  return token || null
}

/** Lo que la app necesita de un push, ya desarmado. */
interface PushContent {
  title: string
  body: string
  link: string
}

function readContent(notification: { title?: string; body?: string; data?: unknown }): PushContent {
  const data = (notification.data ?? {}) as Record<string, string | undefined>
  return {
    title: notification.title ?? data.title ?? 'Jobo',
    body: notification.body ?? data.body ?? '',
    link: data.link ?? '/notificaciones',
  }
}

/**
 * Push que llegan con la app en pantalla. Con la app en segundo plano no pasa
 * por acá: el aviso lo dibuja el sistema y no hay nada que hacer.
 */
export async function onNativeForegroundMessage(handler: (content: PushContent) => void) {
  const handle = await FirebaseMessaging.addListener('notificationReceived', (event) =>
    handler(readContent(event.notification)),
  )
  return () => void handle.remove()
}

/** Cuando tocan el aviso en la barra de notificaciones. */
export async function onNativeNotificationTap(handler: (link: string) => void) {
  const handle = await FirebaseMessaging.addListener('notificationActionPerformed', (event) =>
    handler(readContent(event.notification).link),
  )
  return () => void handle.remove()
}

/**
 * Aviso dibujado por el propio teléfono, sin pasar por la red.
 *
 * Es el equivalente nativo del que la web muestra desde el service worker, y
 * sirve para lo mismo: separar "el teléfono tiene los avisos apagados o en
 * silencio" de "el push no está llegando". Lanza si no se puede.
 */
export async function showNativeTestNotification() {
  const { display } = await LocalNotifications.requestPermissions()
  if (display !== 'granted') throw new Error('sin permiso para mostrar avisos')

  await LocalNotifications.schedule({
    notifications: [
      {
        // Un id fijo: probar dos veces reemplaza el aviso anterior en vez de
        // llenar la barra de notificaciones.
        id: 1,
        title: 'Jobo',
        body: 'Prueba: si ves este aviso, tu teléfono los muestra bien.',
        smallIcon: 'ic_stat_jobo',
      },
    ],
  })
}

/** Deja de recibir push en este dispositivo. Se llama al cerrar sesión. */
export function deleteNativeToken() {
  return FirebaseMessaging.deleteToken()
}
