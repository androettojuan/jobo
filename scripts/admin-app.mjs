import { applicationDefault, cert, initializeApp } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Inicializa el Admin SDK con lo que haya a mano:
 *
 * 1. `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un service-account.json, o
 * 2. las credenciales por defecto que deja `gcloud auth application-default login`
 *    (o `firebase login`), que es lo más cómodo para trabajar a mano.
 *
 * El projectId sale de `.firebaserc` para no repetirlo en cada script.
 */
export function initAdmin() {
  const projectId = JSON.parse(
    readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'),
  ).projects.default

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (keyPath && existsSync(resolve(keyPath))) {
    initializeApp({
      credential: cert(JSON.parse(readFileSync(resolve(keyPath), 'utf8'))),
      projectId,
    })
    return projectId
  }

  try {
    initializeApp({ credential: applicationDefault(), projectId })
  } catch {
    console.error(
      'No encontramos credenciales. Corré `gcloud auth application-default login`\n' +
        'o exportá GOOGLE_APPLICATION_CREDENTIALS con la ruta al service-account.json.',
    )
    process.exit(1)
  }

  return projectId
}
