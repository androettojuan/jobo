import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { httpsCallable } from 'firebase/functions'

import { db, functions } from '@/lib/firebase'
import { uploadImage } from '@/lib/storage'
import type { FirestoreError } from 'firebase/firestore'

import type { Chat, Message, RequestStatus } from '@/types/models'

/** Trabajos que ya no van a moverse: recién ahí tiene sentido archivar la charla. */
const CLOSED_STATUSES = new Set<RequestStatus>(['completed', 'rejected', 'cancelled'])

/**
 * Suscripción en vivo a la lista de chats del usuario.
 * Igual que el resto de los listeners, el `onError` es obligatorio: sin él un
 * fallo deja la pantalla girando el spinner sin decir nunca qué pasó.
 */
export function subscribeToChats(
  uid: string,
  onChange: (chats: Chat[]) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
      limit(50),
    ),
    (snap) =>
      onChange(
        visibleFor(
          uid,
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chat),
        ),
      ),
    onError,
  )
}

/** Los chats que esa persona no archivó. El otro participante sigue viendo el suyo. */
export function visibleFor(uid: string, chats: Chat[]) {
  return chats.filter((chat) => !chat.hiddenFor?.includes(uid))
}

/** Una charla se puede archivar cuando la solicitud que la abrió ya está cerrada. */
export function canHideChat(chat: Chat) {
  return chat.requestStatus !== null && CLOSED_STATUSES.has(chat.requestStatus)
}

/**
 * Saca la conversación de la casilla de quien la archiva. No borra los
 * mensajes: el otro participante conserva su copia, y si vuelve a escribir la
 * charla reaparece (lo limpia `onMessageCreated`).
 */
export async function hideChat(chatId: string, uid: string) {
  await updateDoc(doc(db, 'chats', chatId), { hiddenFor: arrayUnion(uid) })
}

/** Suscripción en vivo a los mensajes de un chat, del más viejo al más nuevo. */
/** Suscripción al chat en sí (participantes, oficio, solicitud asociada). */
export function subscribeToChat(
  chatId: string,
  onChange: (chat: Chat | null) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snap) => onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Chat) : null),
    onError,
  )
}

export function subscribeToMessages(
  chatId: string,
  onChange: (messages: Message[]) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(200)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)),
    onError,
  )
}

/**
 * Pone en cero los no leídos del usuario en un chat. Va por Cloud Function
 * porque `unreadCount` no es escribible desde el cliente.
 */
export async function markChatRead(chatId: string) {
  const callable = httpsCallable<{ chatId: string }, { ok: boolean }>(functions, 'markChatRead')
  await callable({ chatId })
}

/** Envía una foto como mensaje. Se comprime antes de subirla. */
export async function sendImageMessage(chatId: string, senderId: string, file: File) {
  const path = `chats/${chatId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
  const imageUrl = await uploadImage(path, file)

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    chatId,
    senderId,
    kind: 'image',
    text: '',
    imageUrl,
    readBy: [senderId],
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: '📷 Foto',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  })
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const trimmed = text.trim()
  if (!trimmed) return

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    chatId,
    senderId,
    kind: 'text',
    text: trimmed,
    imageUrl: null,
    readBy: [senderId],
    createdAt: serverTimestamp(),
  })

  // Escritura optimista del resumen: la Cloud Function recalcula unreadCount.
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  })
}
