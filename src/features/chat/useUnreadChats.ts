import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'
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
        const unread = snap.docs.filter(
          (doc) => ((doc.data() as Chat).unreadCount?.[firebaseUser.uid] ?? 0) > 0,
        )
        setCount(unread.length)
      },
      () => setCount(0),
    )
  }, [firebaseUser])

  return count
}
