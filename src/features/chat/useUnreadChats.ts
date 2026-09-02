import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { visibleFor } from '@/features/chat/api'
import { db } from '@/lib/firebase'
import type { Chat } from '@/types/models'

/** Cantidad de chats con mensajes sin leer, para el badge de la barra. */
export function useUnreadChats() {
  const { firebaseUser } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!firebaseUser) {
      setCount(0)
      return
    }

    return onSnapshot(
      query(collection(db, 'chats'), where('participantIds', 'array-contains', firebaseUser.uid)),
      (snap) => {
        // Los chats archivados no cuentan: si no están en la casilla, tampoco
        // tienen que pintar el badge de la barra.
        const chats = visibleFor(
          firebaseUser.uid,
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chat),
        )
        setCount(chats.filter((c) => (c.unreadCount?.[firebaseUser.uid] ?? 0) > 0).length)
      },
      () => setCount(0),
    )
  }, [firebaseUser])

  return count
}
