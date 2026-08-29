import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'

export const CLIENT = 'cliente-1'
export const PRO = 'profesional-1'
export const STRANGER = 'extranio-1'
export const ADMIN = 'admin-1'

/**
 * Entorno de pruebas contra el emulador de Firestore.
 * Requiere `npm run emulators` corriendo (o `firebase emulators:exec`).
 */
export function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'jobo-rules-test',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
}

/** Contexto autenticado como super admin (custom claim). */
export function asAdmin(env: RulesTestEnvironment) {
  return env.authenticatedContext(ADMIN, { admin: true }).firestore()
}

export const requestDoc = (overrides: Record<string, unknown> = {}) => ({
  clientId: CLIENT,
  professionalId: PRO,
  participantIds: [CLIENT, PRO],
  categoryId: 'plomero',
  title: 'Pierde la canilla',
  description: 'Gotea hace una semana',
  photos: [],
  locality: null,
  status: 'pending',
  preferredAt: null,
  chatId: 'chat-1',
  completedAt: null,
  cancelledBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const professionalDoc = (overrides: Record<string, unknown> = {}) => ({
  uid: PRO,
  displayName: 'Pro Uno',
  photoURL: null,
  categoryIds: ['plomero'],
  headline: 'Plomero',
  description: '',
  locality: null,
  serviceAreaIds: ['villa-rumipal'],
  hourlyRateFrom: null,
  hourlyRateTo: null,
  photos: [],
  status: 'active',
  verified: false,
  ratingAvg: 0,
  ratingCount: 0,
  completedJobs: 0,
  avgResponseMs: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})
