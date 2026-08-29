/**
 * Sube el catálogo de oficios y localidades a Firestore.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed
 *
 * Lee los mismos JSON que usa la app (`src/lib/data`), así no hay dos listas
 * que mantener. Es idempotente: se puede correr cada vez que se agrega algo.
 */
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!credentialsPath) {
  console.error('Falta GOOGLE_APPLICATION_CREDENTIALS apuntando al service-account.json')
  process.exit(1)
}

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

initializeApp({ credential: cert(read(credentialsPath.startsWith('/') ? credentialsPath : `../${credentialsPath}`)) })
const db = getFirestore()

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
console.log(`Listo: ${categories.length} oficios y ${localities.length} localidades.`)
