import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { Category, Professional, Report, ReportStatus, Review, User } from '@/types/models'

/* --- Denuncias ----------------------------------------------------------- */

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

/* --- Reseñas -------------------------------------------------------------- */

/** La reseña denunciada, para poder leerla antes de decidir. */
export async function getReportedReview(reviewId: string) {
  const snap = await getDoc(doc(db, 'reviews', reviewId))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Review) : null
}

/**
 * Saca una reseña de la vista pública, o la devuelve.
 *
 * No se borra: `hidden` la quita de la ficha del profesional y del cálculo del
 * promedio, pero deja la constancia de que existió. Si la denuncia era
 * infundada se vuelve a mostrar, y eso con un borrado no se puede.
 */
export function setReviewHidden(reviewId: string, hidden: boolean) {
  return updateDoc(doc(db, 'reviews', reviewId), { hidden })
}

/* --- Usuarios ------------------------------------------------------------ */

/**
 * Suspende o reactiva a un usuario. La Cloud Function `onUserDisabledChanged`
 * replica el cambio en Firebase Auth y lo saca de las búsquedas.
 */
export function setUserDisabled(uid: string, disabled: boolean) {
  return updateDoc(doc(db, 'users', uid), { disabled, updatedAt: serverTimestamp() })
}

export async function findUsers(term: string) {
  const value = term.trim().toLowerCase()
  const snap = await getDocs(query(collection(db, 'users'), limit(100)))
  const users = snap.docs.map((d) => d.data() as User)

  if (!value) return users.slice(0, 30)
  return users
    .filter(
      (u) => u.displayName.toLowerCase().includes(value) || u.email.toLowerCase().includes(value),
    )
    .slice(0, 30)
}

/* --- Profesionales ------------------------------------------------------- */

export async function listProfessionals(onlyUnverified = false) {
  const snap = await getDocs(
    query(collection(db, 'professionals'), orderBy('createdAt', 'desc'), limit(50)),
  )
  const list = snap.docs.map((d) => d.data() as Professional)
  return onlyUnverified ? list.filter((p) => !p.verified) : list
}

export function setProfessionalVerified(uid: string, verified: boolean) {
  return updateDoc(doc(db, 'professionals', uid), {
    verified,
    updatedAt: serverTimestamp(),
  })
}

/* --- Categorías propuestas ----------------------------------------------- */

export async function listPendingCategories() {
  const snap = await getDocs(
    query(collection(db, 'categories'), where('status', '==', 'pending'), limit(50)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)
}

/** Aprueba la categoría propuesta, opcionalmente con otro nombre. */
export function approveCategory(categoryId: string, name?: string) {
  return updateDoc(doc(db, 'categories', categoryId), {
    status: 'active',
    active: true,
    ...(name ? { name: name.trim() } : {}),
  })
}

export function rejectCategory(categoryId: string) {
  return updateDoc(doc(db, 'categories', categoryId), { status: 'rejected', active: false })
}

/**
 * Unifica una propuesta con una categoría existente. La Cloud Function
 * `onCategoryUpdated` reasigna los perfiles que la tenían.
 */
export function mergeCategory(categoryId: string, targetId: string) {
  return updateDoc(doc(db, 'categories', categoryId), {
    status: 'rejected',
    active: false,
    mergedInto: targetId,
  })
}
