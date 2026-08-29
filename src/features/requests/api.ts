import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

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

/** Solicitudes donde el usuario participa, sea como cliente o profesional. */
export function subscribeToRequests(uid: string, onChange: (requests: JobRequest[]) => void) {
  return onSnapshot(
    query(
      collection(db, 'requests'),
      where('participantIds', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JobRequest)),
  )
}
