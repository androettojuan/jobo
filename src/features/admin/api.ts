import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { Report, ReportStatus } from '@/types/models'

export async function listReports(status: ReportStatus = 'open') {
  const snap = await getDocs(
    query(
      collection(db, 'reports'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report)
}

export function resolveReport(
  reportId: string,
  adminId: string,
  status: Extract<ReportStatus, 'resolved' | 'dismissed'>,
  resolution: string,
) {
  return updateDoc(doc(db, 'reports', reportId), {
    status,
    resolution,
    resolvedBy: adminId,
    resolvedAt: serverTimestamp(),
  })
}

/** Suspende o reactiva a un usuario. Requiere claim de admin. */
export function setUserDisabled(uid: string, disabled: boolean) {
  return updateDoc(doc(db, 'users', uid), { disabled, updatedAt: serverTimestamp() })
}

/** Marca un perfil profesional como verificado. */
export function setProfessionalVerified(uid: string, verified: boolean) {
  return updateDoc(doc(db, 'professionals', uid), { verified, updatedAt: serverTimestamp() })
}
