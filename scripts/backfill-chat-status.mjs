/**
 * Copia a cada chat el estado de la solicitud que lo abrió.
 *
 *   node scripts/backfill-chat-status.mjs           # muestra qué haría
 *   node scripts/backfill-chat-status.mjs --escribir
 *
 * La casilla necesita ese campo para saber si una charla está cerrada y puede
 * eliminarse. Desde que existe, lo mantienen `createRequest` (al crear) y
 * `onRequestUpdated` (en cada cambio de estado), pero los chats que ya
 * existían nacieron sin él y se quedaron sin el botón de eliminar.
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

const requests = await db.collection('requests').get()

/** chatId -> estado de su solicitud. */
const estados = new Map()
for (const request of requests.docs) {
  const chatId = request.get('chatId')
  if (chatId) estados.set(chatId, request.get('status'))
}

const chats = await db.collection('chats').get()
let pendientes = 0
let batch = db.batch()
let enBatch = 0

for (const chat of chats.docs) {
  const status = estados.get(chat.id) ?? null
  if (chat.get('requestStatus') === status) continue

  pendientes++
  if (!escribir) continue

  batch.update(chat.ref, { requestStatus: status })
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
    ? `Listo en ${projectId}: ${pendientes} chats actualizados de ${chats.size}.`
    : `En ${projectId} hay ${pendientes} chats sin el estado al día, de ${chats.size}. ` +
        'Corré con --escribir para aplicarlo.',
)
