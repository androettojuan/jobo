import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// El build nativo (Capacitor) se compila con `VITE_TARGET=native`. Adentro del
// contenedor el service worker de la PWA no aporta nada y sí puede servir
// código viejo cacheado después de una actualización bajada de la tienda: el
// mismo problema que ya costó caro con los push. La app se actualiza por la
// tienda, no por el service worker.
const isNative = process.env.VITE_TARGET === 'native'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      // En WSL2 el watcher nativo no ve los cambios hechos sobre el sistema de
      // archivos de Linux desde otras herramientas, y el HMR sirve código
      // viejo sin avisar. El sondeo es más caro pero confiable.
      usePolling: process.env.VITE_POLL !== 'false',
      interval: 300,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // `disable` deja el plugin en su lugar —sigue resolviendo
      // `virtual:pwa-register/react`, que importa UpdatePrompt— pero no genera
      // ni registra ningún service worker.
      disable: isNative,
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Jobo',
        short_name: 'Jobo',
        description: 'Encontrá profesionales cerca tuyo',
        theme_color: '#09bc8a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
