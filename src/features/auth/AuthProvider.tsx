import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { auth, db } from '@/lib/firebase'
import type { User } from '@/types/models'

export interface AuthState {
  /** Usuario de Firebase Auth (credenciales). */
  firebaseUser: FirebaseUser | null
  /** Documento users/{uid} (perfil de la app). null si todavía no se creó. */
  profile: User | null
  /** Custom claim `admin` del token: habilita el panel de administración. */
  isAdmin: boolean
  /** false una vez que sabemos si hay sesión y tenemos el perfil. */
  loading: boolean
}

export const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  profile: null,
  isAdmin: false,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }
      // El rol de admin vive en un custom claim, no en Firestore: así no se
      // puede escalar privilegios editando el propio documento de usuario.
      const token = await user.getIdTokenResult()
      setIsAdmin(token.claims.admin === true)
    })
  }, [])

  useEffect(() => {
    if (!firebaseUser) return

    setLoading(true)
    // onSnapshot y no getDoc: si el perfil se crea o cambia (por ejemplo al
    // activar el perfil profesional) la UI se entera sola.
    return onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as User) : null)
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [firebaseUser])

  const value = useMemo(
    () => ({ firebaseUser, profile, isAdmin, loading }),
    [firebaseUser, profile, isAdmin, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
