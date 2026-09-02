import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { canHideChat } from '@/features/chat/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { Chat } from '@/types/models'

/** Una conversación en la casilla, con su botón de eliminar si ya está cerrada. */
export function ChatRow({
  chat,
  uid,
  onDelete,
}: {
  chat: Chat
  uid: string | undefined
  onDelete: (chat: Chat) => void
}) {
  const otherId = chat.participantIds.find((id) => id !== uid)
  const other = otherId ? chat.participants[otherId] : undefined
  const unread = uid ? (chat.unreadCount?.[uid] ?? 0) : 0
  const category = chat.categoryId ? CATEGORIES_BY_ID.get(chat.categoryId) : undefined

  return (
    <li className="flex items-center gap-1">
      <Link to={`/chats/${chat.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
        {other?.photoURL ? (
          <img src={other.photoURL} alt="" className="size-12 rounded-full object-cover" />
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

      {/* Solo cuando el trabajo terminó: mientras la solicitud sigue viva, la
          charla es parte del hilo y no se saca de en medio. */}
      {canHideChat(chat) && (
        <button
          type="button"
          onClick={() => onDelete(chat)}
          aria-label={`Eliminar la conversación con ${other?.displayName ?? 'esta persona'}`}
          className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      )}
    </li>
  )
}
