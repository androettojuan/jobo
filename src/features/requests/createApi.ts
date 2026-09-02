import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  collection,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { JobRequest, LocalityRef, Professional, RequestStatus, User } from '@/types/models'
import type { FirestoreError } from 'firebase/firestore'

export interface NewRequest {
  categoryId: string
  title: string
  description: string
  preferredAt: Date | null
  locality: LocalityRef | null
  photos: string[]
}

/**
 * Crea la solicitud y su chat en una sola escritura atómica: no queremos
 * solicitudes sin chat ni chats huérfanos si algo falla a mitad de camino.
 * Devuelve el id de la solicitud.
 */
export async function createRequest(client: User, professional: Professional, input: NewRequest) {
  const batch = writeBatch(db)
  const requestRef = doc(collection(db, 'requests'))
  const chatRef = doc(collection(db, 'chats'))

  batch.set(chatRef, {
    participantIds: [client.uid, professional.uid],
    participants: {
      [client.uid]: { displayName: client.displayName, photoURL: client.photoURL },
      [professional.uid]: {
        displayName: professional.displayName,
        photoURL: professional.photoURL,
      },
    },
    requestId: requestRef.id,
    categoryId: input.categoryId,
    requestTitle: input.title.trim(),
    lastMessage: input.title,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: client.uid,
    unreadCount: { [client.uid]: 0, [professional.uid]: 1 },
    requestStatus: 'pending' satisfies RequestStatus,
    hiddenFor: [],
    createdAt: serverTimestamp(),
  })

  batch.set(requestRef, {
    clientId: client.uid,
    professionalId: professional.uid,
    participantIds: [client.uid, professional.uid],
    categoryId: input.categoryId,
    title: input.title.trim(),
    description: input.description.trim(),
    photos: input.photos,
    locality: input.locality,
    status: 'pending' satisfies RequestStatus,
    preferredAt: input.preferredAt ? Timestamp.fromDate(input.preferredAt) : null,
    chatId: chatRef.id,
    completedAt: null,
    cancelledBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // El primer mensaje (el pedido en sí) lo escribe `onRequestCreated`: dentro
  // de un batch las reglas todavía no ven el chat recién creado, así que un
  // mensaje escrito acá sería rechazado.
  await batch.commit()
  return requestRef.id
}

export function subscribeToRequest(
  id: string,
  onChange: (request: JobRequest | null) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    doc(db, 'requests', id),
    (snap) => onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as JobRequest) : null),
    onError,
  )
}

/** Transiciones válidas: quién puede pasar de qué estado a cuál. */
const TRANSITIONS: Record<
  RequestStatus,
  { to: RequestStatus; by: 'client' | 'professional' | 'any' }[]
> = {
  pending: [
    { to: 'accepted', by: 'professional' },
    { to: 'rejected', by: 'professional' },
    { to: 'cancelled', by: 'client' },
  ],
  accepted: [
    { to: 'in_progress', by: 'professional' },
    { to: 'cancelled', by: 'any' },
  ],
  in_progress: [
    { to: 'completed', by: 'any' },
    { to: 'cancelled', by: 'any' },
  ],
  rejected: [],
  completed: [],
  cancelled: [],
}

export function allowedTransitions(request: JobRequest, uid: string) {
  const role = request.clientId === uid ? 'client' : 'professional'
  return TRANSITIONS[request.status].flatMap((t) => (t.by === 'any' || t.by === role ? [t.to] : []))
}

export async function updateRequestStatus(request: JobRequest, uid: string, status: RequestStatus) {
  if (!allowedTransitions(request, uid).includes(status)) {
    throw new Error('Transición de estado no permitida')
  }

  await updateDoc(doc(db, 'requests', request.id), {
    status,
    updatedAt: serverTimestamp(),
    ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
    ...(status === 'cancelled' ? { cancelledBy: uid } : {}),
  })
}

/**
 * Teléfono de la otra parte. Solo se resuelve cuando la solicitud está
 * aceptada o más avanzada: antes de eso no hay motivo para exponerlo.
 */
export async function getCounterpartPhone(request: JobRequest, uid: string) {
  const visible = ['accepted', 'in_progress', 'completed'].includes(request.status)
  if (!visible) return null

  const otherId = request.participantIds.find((id) => id !== uid)
  if (!otherId) return null

  const snap = await getDoc(doc(db, 'users', otherId))
  return snap.exists() ? ((snap.data() as User).phone ?? null) : null
}
