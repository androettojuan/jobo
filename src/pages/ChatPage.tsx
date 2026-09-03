import { ArrowLeft, ImagePlus, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { PhotoInput } from '@/components/ui/PhotoInput'
import { MessagesSkeleton } from '@/components/ui/skeletons'
import {
  markChatRead,
  sendImageMessage,
  sendMessage,
  subscribeToChat,
  subscribeToMessages,
} from '@/features/chat/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import { useAuth } from '@/features/auth/useAuth'
import { useBlocked } from '@/features/blocks/useBlocked'
import { cn } from '@/lib/utils'
import type { Chat, Message } from '@/types/models'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { firebaseUser } = useAuth()
  const blocked = useBlocked()
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  // Sin esto no se puede distinguir "todavía no llegó nada" de "chat vacío".
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    return subscribeToMessages(
      chatId,
      (list) => {
        setMessages(list)
        setLoadingMessages(false)
      },
      () => {
        setError('No pudimos cargar la conversación. Revisá la conexión.')
        setLoadingMessages(false)
      },
    )
  }, [chatId])

  useEffect(() => {
    if (!chatId) return
    return subscribeToChat(chatId, setChat, () =>
      setError('No pudimos cargar la conversación. Revisá la conexión.'),
    )
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Al abrir el chat y con cada mensaje nuevo mientras está abierto, lo damos
  // por leído. Si falla no rompemos nada: solo queda el contador en rojo.
  useEffect(() => {
    if (!chatId || messages.length === 0) return
    void markChatRead(chatId).catch(() => {})
  }, [chatId, messages.length])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!chatId || !firebaseUser || !text.trim()) return

    setSending(true)
    const pending = text
    setText('')
    try {
      await sendMessage(chatId, firebaseUser.uid, pending)
    } catch {
      setText(pending) // no perdemos lo escrito si falla el envío
      setError('No pudimos enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  async function onPhoto(file: File) {
    if (!chatId || !firebaseUser) return

    setError('')
    setSending(true)
    try {
      await sendImageMessage(chatId, firebaseUser.uid, file)
    } catch {
      setError('No pudimos enviar la foto.')
    } finally {
      setSending(false)
    }
  }

  const otherId = chat?.participantIds.find((id) => id !== firebaseUser?.uid)
  // El historial se sigue leyendo: bloquear corta lo que viene, no borra lo
  // que ya se dijo. Las reglas rechazan la escritura igual, esto solo evita
  // que alguien escriba un mensaje largo para que se lo rebote el servidor.
  const bloqueado = Boolean(otherId && blocked.has(otherId))
  const otherName = otherId
    ? (chat?.participants[otherId]?.displayName ?? 'Conversación')
    : 'Conversación'
  const category = chat?.categoryId ? CATEGORIES_BY_ID.get(chat.categoryId) : undefined

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top flex items-center gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
        <Link to="/chats" aria-label="Volver a chats">
          <ArrowLeft className="size-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{otherName}</p>
          {(category || chat?.requestTitle) && (
            <p className="truncate text-xs text-slate-500">
              {category && <span className="font-medium text-brand-600">{category.name}</span>}
              {category && chat?.requestTitle && ' · '}
              {chat?.requestTitle}
            </p>
          )}
        </div>

        {chat?.requestId && (
          <Link
            to={`/solicitudes/${chat.requestId}`}
            className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700"
          >
            Ver solicitud
          </Link>
        )}
      </header>

      {loadingMessages && <MessagesSkeleton />}

      <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((message) => {
          const mine = message.senderId === firebaseUser?.uid

          // El pedido inicial se muestra como tarjeta de contexto, no como burbuja.
          if (message.kind === 'system') {
            return (
              <li
                key={message.id}
                className="self-center rounded-2xl border border-slate-200 px-3 py-2 text-center text-xs whitespace-pre-line text-slate-500 dark:border-slate-800"
              >
                {message.text}
              </li>
            )
          }

          if (message.kind === 'image' && message.imageUrl) {
            return (
              <li key={message.id} className={cn('max-w-[70%]', mine ? 'self-end' : 'self-start')}>
                <a href={message.imageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={message.imageUrl}
                    alt="Foto enviada en el chat"
                    className="rounded-2xl object-cover"
                  />
                </a>
              </li>
            )
          }

          return (
            <li
              key={message.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                mine
                  ? 'self-end bg-brand-600 text-white'
                  : 'self-start bg-slate-100 dark:bg-slate-800',
              )}
            >
              {message.text}
            </li>
          )
        })}
        <div ref={bottomRef} />
      </ul>

      {error && <p className="px-4 pb-1 text-xs text-red-600">{error}</p>}

      {bloqueado ? (
        <div className="safe-bottom border-t border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-800">
          Bloqueaste a esta persona. Para volver a escribirle, desbloqueala desde su perfil.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="safe-bottom flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
        >
          <PhotoInput
            aria-label="Enviar una foto"
            disabled={sending}
            onPick={(file) => void onPhoto(file)}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-300 text-slate-500 dark:border-slate-700"
          >
            <ImagePlus className="size-5" aria-hidden />
          </PhotoInput>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí un mensaje…"
            aria-label="Mensaje"
            className="h-11 flex-1 rounded-full border border-slate-300 px-4 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
          />
          <Button
            type="submit"
            className="aspect-square px-0"
            loading={sending}
            aria-label="Enviar"
          >
            {!sending && <Send className="size-4" aria-hidden />}
          </Button>
        </form>
      )}
    </div>
  )
}
