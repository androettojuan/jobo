import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { auth, db } from '@/lib/firebase'
import type { User } from '@/types/models'

import { AuthContext } from './AuthContext'
import { writeProfessionalHint, writeSignedInHint } from './sessionHints'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      // Para que el próximo arranque sepa de entrada si va la campana o el
      // enlace de entrar, en vez de dibujar uno y cambiarlo por el otro.
      writeSignedInHint(Boolean(user))
      if (!user) {
        setProfile(null)
        setIsAdmin(false)
        setLoading(false)
        writeProfessionalHint(false)
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
        const user = snap.exists() ? (snap.data() as User) : null
        setProfile(user)
        setLoading(false)
        // Para que la próxima carga sepa de entrada si va la pestaña de trabajo.
        writeProfessionalHint(Boolean(user?.isProfessional))
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
