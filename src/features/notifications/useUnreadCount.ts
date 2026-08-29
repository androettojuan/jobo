import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '@/lib/firebase'
import { useAuth } from '@/features/auth/useAuth'

/** Cantidad de notificaciones sin leer, para el punto rojo de la barra. */
export function useUnreadNotifications() {
  const { firebaseUser } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!firebaseUser) {
      setCount(0)
      return
    }

    return onSnapshot(
      query(collection(db, 'users', firebaseUser.uid, 'notifications'), where('read', '==', false)),
      (snap) => setCount(snap.size),
      () => setCount(0),
    )
  }, [firebaseUser])

  return count
}
