import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import type { FirestoreError } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { JobRequest, RequestStatus } from '@/types/models'

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

/**
 * Solicitudes donde el usuario participa, sea como cliente o profesional.
 * El `onError` no es opcional por capricho: sin él, un fallo de la consulta
 * deja la pantalla en el spinner para siempre, sin decir nada.
 */
export function subscribeToRequests(
  uid: string,
  onChange: (requests: JobRequest[]) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    query(
      collection(db, 'requests'),
      where('participantIds', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
      // La misma consulta alimenta las dos pestañas (lo que pedí y lo que me
      // pidieron) y sus contadores, así que el tope se reparte entre ambas.
      limit(200),
    ),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JobRequest)),
    onError,
  )
}
