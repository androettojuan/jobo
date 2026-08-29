import { ArrowLeft, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { sendMessage, subscribeToMessages } from '@/features/chat/api'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/models'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const { firebaseUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    return subscribeToMessages(chatId, setMessages)
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

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
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
        <Link to="/chats" aria-label="Volver a chats">
          <ArrowLeft className="size-5" />
        </Link>
        <span className="font-medium">Conversación</span>
      </header>

      <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.map((message) => {
          const mine = message.senderId === firebaseUser?.uid
          return (
            <li
              key={message.id}
              className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', mine
                ? 'self-end bg-brand-600 text-white'
                : 'self-start bg-slate-100 dark:bg-slate-800')}
            >
              {message.text}
            </li>
          )
        })}
        <div ref={bottomRef} />
      </ul>

      <form onSubmit={onSubmit} className="safe-bottom flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí un mensaje…"
          aria-label="Mensaje"
          className="h-11 flex-1 rounded-full border border-slate-300 px-4 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
        <Button type="submit" className="aspect-square px-0" loading={sending} aria-label="Enviar">
          {!sending && <Send className="size-4" aria-hidden />}
        </Button>
      </form>
    </div>
  )
}
