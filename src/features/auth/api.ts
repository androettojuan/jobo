import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import { auth, db } from '@/lib/firebase'

/** Crea users/{uid} si todavía no existe. Idempotente. */
async function ensureProfile(
  uid: string,
  data: { displayName: string; email: string; photoURL: string | null },
) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  await setDoc(ref, {
    uid,
    displayName: data.displayName,
    email: data.email,
    phone: null,
    phoneIsPublic: false,
    photoURL: data.photoURL,
    location: null,
    isProfessional: false,
    fcmTokens: [],
    disabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function registerWithEmail(params: {
  displayName: string
  email: string
  password: string
}) {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password)
  await updateProfile(cred.user, { displayName: params.displayName })
  await ensureProfile(cred.user.uid, {
    displayName: params.displayName,
    email: params.email,
    photoURL: null,
  })
  return cred.user
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider())
  await ensureProfile(cred.user.uid, {
    displayName: cred.user.displayName ?? 'Usuario',
    email: cred.user.email ?? '',
    photoURL: cred.user.photoURL,
  })
  return cred.user
}

export function logout() {
  return signOut(auth)
}

/** Traduce los códigos de Firebase Auth a mensajes que se le pueden mostrar a alguien. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'El email no es válido.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o contraseña incorrectos.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese email.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de terminar.'
    case 'auth/network-request-failed':
      return 'No hay conexión. Revisá tu internet.'
    case 'auth/operation-not-allowed':
      return 'El registro con email está deshabilitado. Probá con Google.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Esperá un momento y probá de nuevo.'
    case 'auth/user-disabled':
      return 'Tu cuenta fue suspendida. Escribinos si creés que es un error.'
    default:
      return 'Algo salió mal. Probá de nuevo.'
  }
}
