/* global importScripts, firebase */
/**
 * Service worker de Firebase Cloud Messaging: recibe los push cuando la app
 * está cerrada o en segundo plano.
 *
 * Va aparte del service worker de la PWA (cada uno con su scope). La config
 * está hardcodeada porque un service worker no lee variables de entorno; son
 * claves públicas de cliente, no secretos.
 */
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyC5ceT5X3lbBl3TA-dJEf9_iMcKMzoTGzk',
  authDomain: 'jobo-8b688.firebaseapp.com',
  projectId: 'jobo-8b688',
  storageBucket: 'jobo-8b688.firebasestorage.app',
  messagingSenderId: '891114567956',
  appId: '1:891114567956:web:038e5920310d3516e06a01',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'Jobo', {
    body: body ?? '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { link: payload.data?.link ?? '/' },
  })
})

// Tocar la notificación abre la pantalla correspondiente, reutilizando la
// pestaña de la app si ya estaba abierta.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(link)
          return client.focus()
        }
      }
      return self.clients.openWindow(link)
    }),
  )
})
