import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) }

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'reglas',
          // Hablan con el emulador: sin entorno de navegador y con un timeout
          // holgado para el arranque en frío.
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          testTimeout: 15_000,
          hookTimeout: 30_000,
          fileParallelism: false,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'ui',
          // Pantallas: no tocan Firestore, se les inyectan los datos.
          environment: 'jsdom',
          include: ['tests/**/*.test.tsx'],
          setupFiles: ['./tests/setup-ui.ts'],
        },
      },
    ],
  },
})
