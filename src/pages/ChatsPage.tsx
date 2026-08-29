import { MessagesSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { subscribeToChats } from '@/features/chat/api'
import { useAuth } from '@/features/auth/useAuth'
import type { Chat } from '@/types/models'

export function ChatsPage() {
  const { firebaseUser } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToChats(firebaseUser.uid, (list) => {
      setChats(list)
      setLoading(false)
    })
  }, [firebaseUser])

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Chats</h1>

      {chats.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No tenés conversaciones"
          description="Cuando pidas o recibas un presupuesto se abre un chat con la otra persona."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {chats.map((chat) => {
            const otherId = chat.participantIds.find((id) => id !== firebaseUser?.uid)
            const other = otherId ? chat.participants[otherId] : undefined
            const unread = firebaseUser ? (chat.unreadCount?.[firebaseUser.uid] ?? 0) : 0

            return (
              <li key={chat.id}>
                <Link to={`/chats/${chat.id}`} className="flex items-center gap-3 py-3">
                  {other?.photoURL ? (
                    <img src={other.photoURL} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-slate-100 font-semibold text-slate-500 dark:bg-slate-800">
                      {other?.displayName?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{other?.displayName ?? 'Conversación'}</p>
                    <p className="truncate text-sm text-slate-500">{chat.lastMessage}</p>
                  </div>
                  {unread > 0 && (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-medium text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
