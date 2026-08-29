/**
 * Sube el catálogo de oficios y localidades a Firestore.
 *
 *   npm run seed
 *
 * Lee los mismos JSON que usa la app (`src/lib/data`), así no hay dos listas
 * que mantener. Es idempotente: se puede correr cada vez que se agrega algo.
 */
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'

import { initAdmin } from './admin-app.mjs'

const projectId = initAdmin()
const db = getFirestore()

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const categories = read('../src/lib/data/categories.json')
const localities = read('../src/lib/data/localities.json')

const batch = db.batch()

for (const category of categories) {
  // `merge` para no pisar el nombre si un admin lo editó desde el panel.
  batch.set(
    db.doc(`categories/${category.id}`),
    { ...category, status: 'active', proposedBy: null, mergedInto: null },
    { merge: true },
  )
}

for (const locality of localities) {
  batch.set(db.doc(`localities/${locality.id}`), locality, { merge: true })
}

await batch.commit()
console.log(`Listo en ${projectId}: ${categories.length} oficios y ${localities.length} localidades.`)
