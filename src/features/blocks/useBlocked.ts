import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'

import { subscribeToBlocked } from './api'

/** Un `Set` vacío estable: evita que cada render devuelva una referencia nueva. */
const NINGUNO: ReadonlySet<string> = new Set()

/**
 * Los uid que bloqueaste, para consultar de a uno.
 *
 * `Set` y no array: la home pregunta "¿está bloqueado?" una vez por resultado
 * de la búsqueda, y con un `includes` eso sería cuadrático.
 */
export function useBlocked(): ReadonlySet<string> {
  const { firebaseUser } = useAuth()
  // De quién son los bloqueos que hay guardados. Sin eso, al cambiar de cuenta
  // se devolverían los de la anterior hasta que conteste el listener nuevo.
  const [state, setState] = useState<{ uid: string | null; blocked: ReadonlySet<string> }>({
    uid: null,
    blocked: NINGUNO,
  })

  useEffect(() => {
    if (!firebaseUser) return

    const { uid } = firebaseUser
    return subscribeToBlocked(
      uid,
      (lista) => setState({ uid, blocked: new Set(lista.map((entrada) => entrada.uid)) }),
      () => setState({ uid, blocked: NINGUNO }),
    )
  }, [firebaseUser])

  return state.uid === (firebaseUser?.uid ?? null) ? state.blocked : NINGUNO
}
