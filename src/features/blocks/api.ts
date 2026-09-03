import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import type { FirestoreError } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { Block } from '@/types/models'

/**
 * Bloquear a alguien. Lo exige la guía 1.2 de la App Store para cualquier app
 * con contenido de usuarios, y hace falta igual: denunciar tarda lo que tarda
 * la moderación, bloquear corta el problema ahora.
 *
 * Corta en las dos direcciones: ni te escribe ni le escribís, y no puede
 * pedirte presupuesto ni vos a él. Lo hacen cumplir las reglas de Firestore,
 * no la pantalla: si no, alcanzaría con otro cliente para saltearlo.
 */
export function blockUser(
  uid: string,
  other: { uid: string; displayName: string; photoURL: string | null },
) {
  return setDoc(doc(db, 'users', uid, 'blocked', other.uid), {
    uid: other.uid,
    displayName: other.displayName,
    photoURL: other.photoURL,
    createdAt: serverTimestamp(),
  })
}

export function unblockUser(uid: string, otherUid: string) {
  return deleteDoc(doc(db, 'users', uid, 'blocked', otherUid))
}

/**
 * Los bloqueos propios, en vivo.
 *
 * El `onError` es obligatorio a propósito, como en el resto de la app: sin él
 * un fallo del listener deja la pantalla esperando para siempre.
 */
export function subscribeToBlocked(
  uid: string,
  onChange: (blocked: Block[]) => void,
  onError: (error: FirestoreError) => void,
) {
  return onSnapshot(
    collection(db, 'users', uid, 'blocked'),
    (snap) => onChange(snap.docs.map((found) => found.data() as Block)),
    onError,
  )
}
