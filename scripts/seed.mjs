/**
 * Sube el catálogo de oficios a Firestore.
 *
 *   npm run seed
 *
 * Lee el mismo JSON que usa la app (`src/lib/data`), así no hay dos listas que
 * mantener. Es idempotente: se puede correr cada vez que se agrega algo.
 *
 * Las localidades no se suben: son 4037 y nadie las lee desde Firestore. El
 * catálogo vive en `src/lib/data/localities.json` y lo carga el navegador.
 */
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'

import { initAdmin } from './admin-app.mjs'

const projectId = initAdmin()
const db = getFirestore()

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const categories = read('../src/lib/data/categories.json')

const batch = db.batch()

for (const category of categories) {
  // `merge` para no pisar el nombre si un admin lo editó desde el panel.
  batch.set(
    db.doc(`categories/${category.id}`),
    { ...category, status: 'active', proposedBy: null, mergedInto: null },
    { merge: true },
  )
}

await batch.commit()
console.log(`Listo en ${projectId}: ${categories.length} oficios.`)
