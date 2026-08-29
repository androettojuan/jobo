import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { uploadImage } from '@/lib/storage'
import type { LocalityRef } from '@/types/models'

export interface UserProfileDraft {
  displayName: string
  phone: string | null
  phoneIsPublic: boolean
  locality: LocalityRef | null
}

export async function updateUserProfile(uid: string, draft: UserProfileDraft) {
  await updateDoc(doc(db, 'users', uid), {
    ...draft,
    displayName: draft.displayName.trim(),
    phone: draft.phone?.trim() || null,
    updatedAt: serverTimestamp(),
  })
}

export async function uploadAvatar(uid: string, file: File) {
  // Ruta fija: cada foto nueva reemplaza a la anterior en vez de acumular.
  const photoURL = await uploadImage(`users/${uid}/avatar`, file)
  await updateDoc(doc(db, 'users', uid), { photoURL, updatedAt: serverTimestamp() })
  return photoURL
}
