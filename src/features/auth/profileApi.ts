import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

import { db, storage } from '@/lib/firebase'
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
  const fileRef = ref(storage, `users/${uid}/avatar`)
  await uploadBytes(fileRef, file)
  const photoURL = await getDownloadURL(fileRef)
  await updateDoc(doc(db, 'users', uid), { photoURL, updatedAt: serverTimestamp() })
  return photoURL
}
