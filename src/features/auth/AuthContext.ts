import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

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

/**
 * Vive fuera de `AuthProvider.tsx` a propósito: si el archivo del componente
 * exporta además el contexto, Fast Refresh no puede conservar el estado y
 * recarga la app entera en cada cambio.
 */
export const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  profile: null,
  isAdmin: false,
  loading: true,
})
