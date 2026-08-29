import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { Professional, Review } from '@/types/models'

interface SearchOptions {
  categoryId?: string
  /** Slug de localidad: matchea contra las zonas donde el profesional trabaja. */
  localityId?: string
  max?: number
}

/**
 * Lista profesionales activos por categoría y/o localidad.
 * Firestore admite un solo `array-contains` por consulta, así que cuando se
 * filtra por ambas cosas la categoría va a la consulta y la localidad se
 * filtra en memoria (el volumen por pueblo es chico).
 */
export async function searchProfessionals({ categoryId, localityId, max = 30 }: SearchOptions = {}) {
  const arrayFilter = categoryId
    ? where('categoryIds', 'array-contains', categoryId)
    : localityId
      ? where('serviceAreaIds', 'array-contains', localityId)
      : null

  const constraints = [
    where('status', '==', 'active'),
    ...(arrayFilter ? [arrayFilter] : []),
    orderBy('ratingAvg', 'desc'),
    limit(categoryId && localityId ? max * 3 : max),
  ]

  const snap = await getDocs(query(collection(db, 'professionals'), ...constraints))
  const list = snap.docs.map((d) => d.data() as Professional)

  if (categoryId && localityId) {
    return list.filter((p) => p.serviceAreaIds.includes(localityId)).slice(0, max)
  }
  return list
}

export async function getProfessional(uid: string) {
  const snap = await getDoc(doc(db, 'professionals', uid))
  return snap.exists() ? (snap.data() as Professional) : null
}

export async function getReviews(professionalId: string, max = 20) {
  const snap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('professionalId', '==', professionalId),
      where('hidden', '==', false),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review)
}
