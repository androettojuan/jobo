import { MessagesSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { subscribeToChats } from '@/features/chat/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types/models'

export function ChatsPage() {
  const { firebaseUser } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToChats(firebaseUser.uid, (list) => {
      setChats(list)
      setLoading(false)
    })
  }, [firebaseUser])

  // Solo mostramos filtros de los oficios por los que realmente te escribieron.
  const availableCategories = useMemo(() => {
    const ids = [...new Set(chats.map((c) => c.categoryId).filter((id): id is string => !!id))]
    return ids.map((id) => ({ id, name: CATEGORIES_BY_ID.get(id)?.name ?? id }))
  }, [chats])

  const visible = filter ? chats.filter((c) => c.categoryId === filter) : chats

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Chats</h1>

      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm',
              filter === ''
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 dark:border-slate-700',
            )}
          >
            Todos
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm',
                filter === category.id
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 dark:border-slate-700',
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={filter ? 'Sin chats de este oficio' : 'No tenés conversaciones'}
          description={
            filter
              ? 'Probá sacando el filtro para ver el resto de tus conversaciones.'
              : 'Cuando pidas o recibas un presupuesto se abre un chat con la otra persona.'
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {visible.map((chat) => {
            const otherId = chat.participantIds.find((id) => id !== firebaseUser?.uid)
            const other = otherId ? chat.participants[otherId] : undefined
            const unread = firebaseUser ? (chat.unreadCount?.[firebaseUser.uid] ?? 0) : 0
            const category = chat.categoryId ? CATEGORIES_BY_ID.get(chat.categoryId) : undefined

            return (
              <li key={chat.id}>
                <Link to={`/chats/${chat.id}`} className="flex items-center gap-3 py-3">
                  {other?.photoURL ? (
                    <img
                      src={other.photoURL}
                      alt=""
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid size-12 place-items-center rounded-full bg-slate-100 font-semibold text-slate-500 dark:bg-slate-800">
                      {other?.displayName?.charAt(0) ?? '?'}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{other?.displayName ?? 'Conversación'}</p>
                      {category && (
                        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-slate-800 dark:text-brand-500">
                          {category.name}
                        </span>
                      )}
                    </div>
                    {chat.requestTitle && (
                      <p className="truncate text-xs text-slate-400">{chat.requestTitle}</p>
                    )}
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
