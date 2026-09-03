import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { LocalityRef, Professional, ProfessionalStatus } from '@/types/models'

export interface ProfessionalDraft {
  headline: string
  description: string
  categoryIds: string[]
  locality: LocalityRef | null
  serviceAreaIds: string[]
  hourlyRateFrom: number | null
  hourlyRateTo: number | null
  photos: string[]
  status: ProfessionalStatus
}

/**
 * Prende o apaga la disponibilidad, sin pasar por el formulario entero.
 *
 * Pausar solo saca de las búsquedas (`searchProfessionals` filtra por
 * `status == 'active'`). Los chats abiertos, las solicitudes en curso y las
 * calificaciones quedan intactos: no es dar de baja el perfil, es dejar de
 * aparecer mientras no podés tomar trabajo.
 */
export function setProfessionalStatus(uid: string, status: ProfessionalStatus) {
  return updateDoc(doc(db, 'professionals', uid), { status, updatedAt: serverTimestamp() })
}

export async function getMyProfessional(uid: string) {
  const snap = await getDoc(doc(db, 'professionals', uid))
  return snap.exists() ? (snap.data() as Professional) : null
}

/**
 * Crea o actualiza el perfil profesional y marca al usuario como profesional.
 * Nunca toca los agregados (rating, trabajos, verificado): las reglas lo impiden
 * y los mantienen las Cloud Functions.
 */
export async function saveProfessional(
  uid: string,
  identity: { displayName: string; photoURL: string | null; publicPhone: string | null },
  draft: ProfessionalDraft,
) {
  const ref = doc(db, 'professionals', uid)
  const existing = await getDoc(ref)

  const base = {
    uid,
    displayName: identity.displayName,
    photoURL: identity.photoURL,
    headline: draft.headline.trim(),
    description: draft.description.trim(),
    categoryIds: draft.categoryIds,
    locality: draft.locality,
    // La localidad propia siempre cuenta como zona de trabajo.
    serviceAreaIds: [
      ...new Set([...draft.serviceAreaIds, ...(draft.locality ? [draft.locality.id] : [])]),
    ],
    hourlyRateFrom: draft.hourlyRateFrom,
    hourlyRateTo: draft.hourlyRateTo,
    photos: draft.photos,
    status: draft.status,
    updatedAt: serverTimestamp(),
  }

  if (existing.exists()) {
    await updateDoc(ref, base)
  } else {
    await setDoc(ref, {
      ...base,
      publicPhone: identity.publicPhone,
      verified: false,
      ratingAvg: 0,
      ratingCount: 0,
      completedJobs: 0,
      avgResponseMs: null,
      createdAt: serverTimestamp(),
    })
  }

  await updateDoc(doc(db, 'users', uid), {
    isProfessional: true,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Propone una categoría que no está en el catálogo. Queda pendiente de
 * aprobación del admin y no aparece en las búsquedas hasta entonces.
 */
export async function proposeCategory(uid: string, name: string) {
  const id = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  await setDoc(doc(collection(db, 'categories'), id), {
    id,
    name: name.trim(),
    icon: 'wrench',
    order: 999,
    active: false,
    status: 'pending',
    proposedBy: uid,
    mergedInto: null,
  })

  return id
}
