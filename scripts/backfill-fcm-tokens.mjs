/**
 * Migra `users/{uid}.fcmTokens` de la forma vieja a la nueva.
 *
 *   node scripts/backfill-fcm-tokens.mjs            # muestra qué haría
 *   node scripts/backfill-fcm-tokens.mjs --escribir
 *
 * Antes era un array de strings, de cuando Jobo existía solo en la web. Ahora
 * cada entrada guarda `{ token, platform }`, porque el push que hay que armar
 * es distinto en cada plataforma: la web necesita bloque `webpush`, Android no
 * dibuja nada si el mensaje llega solo con `data`, y iOS no recibe nada sin
 * bloque `apns`.
 *
 * Todo lo guardado hasta ahora salió de un navegador, así que se marca como
 * `web`. `functions/src/shared.ts` entiende las dos formas igual, para los
 * clientes que sigan sin actualizar mientras tanto.
 *
 * Es idempotente: se puede correr las veces que haga falta.
 *
 * OJO: sin FIRESTORE_EMULATOR_HOST apunta a PRODUCCIÓN.
 */
import { getFirestore } from 'firebase-admin/firestore'

import { initAdmin } from './admin-app.mjs'

const escribir = process.argv.includes('--escribir')
const projectId = initAdmin()
const db = getFirestore()

const users = await db.collection('users').get()

let pendientes = 0
let tokensMigrados = 0
let batch = db.batch()
let enBatch = 0

for (const user of users.docs) {
  const guardados = user.get('fcmTokens')
  if (!Array.isArray(guardados) || guardados.length === 0) continue

  const viejos = guardados.filter((entrada) => typeof entrada === 'string')

  // Se rearma el array entero en vez de tocar entrada por entrada: un usuario
  // con las dos formas mezcladas queda consistente de una sola pasada.
  //
  // El dedup importa: un navegador ya registrado antes del cambio vuelve a
  // guardarse con la forma nueva, y queda el mismo token dos veces. Sin
  // limpiarlo, ese teléfono recibe cada aviso duplicado.
  const vistos = new Set()
  const migrados = []
  for (const entrada of guardados) {
    const token = typeof entrada === 'string' ? entrada : entrada?.token
    if (typeof token !== 'string' || token === '' || vistos.has(token)) continue
    vistos.add(token)
    migrados.push(typeof entrada === 'string' ? { token, platform: 'web' } : entrada)
  }

  if (viejos.length === 0 && migrados.length === guardados.length) continue

  pendientes++
  tokensMigrados += viejos.length
  if (!escribir) continue

  batch.update(user.ref, { fcmTokens: migrados })
  // Los batch de Firestore cortan en 500 escrituras.
  if (++enBatch === 400) {
    await batch.commit()
    batch = db.batch()
    enBatch = 0
  }
}

if (escribir && enBatch > 0) await batch.commit()

console.log(
  escribir
    ? `Listo en ${projectId}: ${pendientes} cuentas actualizadas ` +
        `(${tokensMigrados} tokens con la forma vieja y los repetidos que hubiera).`
    : `En ${projectId} hay ${pendientes} cuentas por limpiar, de ${users.size}: ` +
        `${tokensMigrados} tokens con la forma vieja, más los repetidos. ` +
        'Corré con --escribir para aplicarlo.',
)
