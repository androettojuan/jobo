import {
  addDoc,
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

import { getFunctions, httpsCallable } from 'firebase/functions'

import { app, db } from '@/lib/firebase'
import type { Chat, Message } from '@/types/models'

/** Suscripción en vivo a la lista de chats del usuario. */
export function subscribeToChats(uid: string, onChange: (chats: Chat[]) => void) {
  return onSnapshot(
    query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
      limit(50),
    ),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chat)),
  )
}

/** Suscripción en vivo a los mensajes de un chat, del más viejo al más nuevo. */
/** Suscripción al chat en sí (participantes, oficio, solicitud asociada). */
export function subscribeToChat(chatId: string, onChange: (chat: Chat | null) => void) {
  return onSnapshot(doc(db, 'chats', chatId), (snap) =>
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Chat) : null),
  )
}

export function subscribeToMessages(chatId: string, onChange: (messages: Message[]) => void) {
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(200)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)),
  )
}

/**
 * Pone en cero los no leídos del usuario en un chat. Va por Cloud Function
 * porque `unreadCount` no es escribible desde el cliente.
 */
export async function markChatRead(chatId: string) {
  const callable = httpsCallable<{ chatId: string }, { ok: boolean }>(
    getFunctions(app),
    'markChatRead',
  )
  await callable({ chatId })
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
