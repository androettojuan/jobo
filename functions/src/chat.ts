import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

import { db, FieldValue, notify } from './shared.js'

/** Cada mensaje suma un no leído al receptor y le avisa por push. */
export const onMessageCreated = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data()
    if (!message || message.kind === 'system') return

    const chatRef = db.doc(`chats/${event.params.chatId}`)
    const chat = await chatRef.get()
    if (!chat.exists) return

    const participantIds: string[] = chat.get('participantIds') ?? []
    const recipients = participantIds.filter((uid) => uid !== message.senderId)
    const senderName = chat.get(`participants.${message.senderId}.displayName`) ?? 'Alguien'

    await chatRef.update(
      Object.fromEntries(
        recipients.map((uid) => [`unreadCount.${uid}`, FieldValue.increment(1)]),
      ),
    )

    await Promise.all(
      recipients.map((uid) =>
        notify({
          uid,
          type: 'message_received',
          title: senderName,
          body: message.kind === 'image' ? 'Te envió una foto' : (message.text ?? ''),
          link: `/chats/${event.params.chatId}`,
        }),
      ),
    )
  },
)

/**
 * Marca el chat como leído para quien llama. Es callable y no una escritura
 * directa porque `unreadCount` está bloqueado para el cliente en las reglas.
 */
export const markChatRead = onCall<{ chatId: string }>(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Necesitás iniciar sesión.')

  const chatId = request.data?.chatId
  if (!chatId) throw new HttpsError('invalid-argument', 'Falta el chat.')

  const chatRef = db.doc(`chats/${chatId}`)
  const chat = await chatRef.get()
  if (!chat.exists) throw new HttpsError('not-found', 'El chat no existe.')

  const participantIds: string[] = chat.get('participantIds') ?? []
  if (!participantIds.includes(uid)) {
    throw new HttpsError('permission-denied', 'No participás de este chat.')
  }

  await chatRef.update({ [`unreadCount.${uid}`]: 0 })
  return { ok: true }
})
