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

// Sin esto, una versión nueva de este archivo se queda esperando a que se
// cierren todas las pestañas: mientras tanto sigue atendiendo los push el
// service worker viejo, que puede no entender el formato nuevo.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

const messaging = firebase.messaging()

// Los push llegan solo con `data`: el título y el cuerpo vienen ahí. Si
// vinieran en `notification`, el SDK dibujaría su propio aviso además de
// este y se verían dos.
messaging.onBackgroundMessage((payload) => {
  // `data` es el formato actual; `notification` queda como red de seguridad
  // por si algún envío viejo sigue en camino.
  const { title, body, link } = { ...payload.notification, ...payload.data }
  self.registration.showNotification(title || 'Jobo', {
    body: body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    // Un aviso por conversación: el nuevo reemplaza al anterior del mismo hilo.
    tag: link || 'jobo',
    data: { link: link || '/' },
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
