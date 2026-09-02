import { MessagesSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AvatarListSkeleton } from '@/components/ui/skeletons'
import { useAuth } from '@/features/auth/useAuth'
import { hideChat, subscribeToChats } from '@/features/chat/api'
import { ChatRow } from '@/features/chat/components/ChatRow'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types/models'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'

export function ChatsPage() {
  const { firebaseUser } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [error, setError] = useState('')
  // La conversación que se está por eliminar, mientras se confirma.
  const [toDelete, setToDelete] = useState<Chat | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToChats(
      firebaseUser.uid,
      (list) => {
        setChats(list)
        setError('')
        setLoading(false)
      },
      () => {
        setError('No pudimos cargar tus chats. Revisá la conexión y volvé a entrar.')
        setLoading(false)
      },
    )
  }, [firebaseUser])

  // Solo mostramos filtros de los oficios por los que realmente te escribieron.
  const availableCategories = useMemo(() => {
    const ids = [...new Set(chats.map((c) => c.categoryId).filter((id): id is string => !!id))]
    return ids.map((id) => ({ id, name: CATEGORIES_BY_ID.get(id)?.name ?? id }))
  }, [chats])

  const visible = filter ? chats.filter((c) => c.categoryId === filter) : chats

  async function remove() {
    if (!toDelete || !firebaseUser) return

    setDeleting(true)
    try {
      await hideChat(toDelete.id, firebaseUser.uid)
      setToDelete(null)
    } catch {
      setError('No pudimos eliminar la conversación. Probá de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <AvatarListSkeleton />

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Chats</h1>
        <NotificationsBell />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && availableCategories.length > 1 && (
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

      {error ? null : visible.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={filter ? 'Sin chats de este oficio' : 'No tenés conversaciones'}
          description={
            filter
              ? 'Probá sacando el filtro para ver el resto de tus conversaciones.'
              : 'Cuando contactes a alguien, o te contacten, se abre un chat.'
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {visible.map((chat) => (
            <ChatRow key={chat.id} chat={chat} uid={firebaseUser?.uid} onDelete={setToDelete} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar la conversación"
        description="Se saca de tu casilla. La otra persona conserva la suya, y si te vuelve a escribir la charla reaparece."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void remove()}
      />
    </div>
  )
}
