import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { auth, db, functions } from '@/lib/firebase'
import { isNative } from '@/lib/platform'

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
    // Cuándo aceptó los términos. Apple pide que se acepten antes de publicar
    // nada, y si algún día cambian hay que saber quién vio cuál versión.
    acceptedTermsAt: serverTimestamp(),
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

/**
 * Deja la sesión lista después de entrar con un proveedor: crea el documento
 * de perfil si es la primera vez.
 *
 * `fallbackName` existe por Apple: el nombre lo manda **una sola vez**, en el
 * primer login, y el usuario de Firebase todavía no lo tiene. Si no se guarda
 * en ese momento, no se recupera nunca más.
 */
async function finishProviderLogin(user: User, fallbackName?: string | null) {
  await ensureProfile(user.uid, {
    displayName: user.displayName ?? fallbackName ?? 'Usuario',
    email: user.email ?? '',
    photoURL: user.photoURL,
  })
  return user
}

export async function loginWithGoogle() {
  // En la web alcanza con el popup. Adentro del contenedor nativo no abre
  // nada: el WebView no tiene dónde poner esa ventana. Ahí se hace el login
  // con la pantalla nativa de Google y después se canjea el token por una
  // sesión del SDK de JavaScript, que es la que usa toda la app.
  if (!isNative) {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    return finishProviderLogin(cred.user)
  }

  const result = await FirebaseAuthentication.signInWithGoogle()
  const idToken = result.credential?.idToken
  if (!idToken) throw new Error('Google no devolvió el token de identidad')

  const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
  return finishProviderLogin(cred.user, result.user?.displayName)
}

/**
 * Login con Apple. Solo se ofrece en iOS: la regla 4.8 de la App Store exige
 * una alternativa que preserve la privacidad cuando hay login con Google.
 */
export async function loginWithApple() {
  const result = await FirebaseAuthentication.signInWithApple()
  const { idToken, nonce } = result.credential ?? {}
  if (!idToken) throw new Error('Apple no devolvió el token de identidad')

  // `rawNonce` tiene que ser el mismo que firmó el token; el plugin lo
  // devuelve ya generado. Sin él, Firebase rechaza la credencial.
  const credential = new OAuthProvider('apple.com').credential({ idToken, rawNonce: nonce })
  const cred = await signInWithCredential(auth, credential)
  return finishProviderLogin(cred.user, result.user?.displayName)
}

export async function logout() {
  // En nativo también hay que cerrar la sesión del lado del plugin: si no,
  // la próxima vez Google entra derecho con la última cuenta, sin dejar
  // elegir otra.
  if (isNative) await FirebaseAuthentication.signOut()
  await signOut(auth)
}

/**
 * Borra la cuenta y todo lo que cuelga de ella.
 *
 * Va por Cloud Function porque el cliente no puede tocar ni la mitad de lo
 * que hay que limpiar: reseñas ajenas, chats compartidos, denuncias. Lo que
 * es de a dos se anonimiza en vez de borrarse, para no romperle el historial
 * a la otra persona.
 *
 * Al terminar, la sesión ya no vale: se cierra para que la app no quede
 * mostrando datos de una cuenta que no existe.
 */
export async function deleteAccount() {
  const callable = httpsCallable<void, { ok: boolean }>(functions, 'deleteAccount')
  await callable()
  await logout()
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
    case 'auth/account-exists-with-different-credential':
      return 'Ya hay una cuenta con ese email, creada con otro método de ingreso.'
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
