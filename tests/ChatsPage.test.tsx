import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ME } from './factories'
import type { Chat } from '@/types/models'

let emit: (chats: Chat[]) => void
let fail: () => void

const CLOSED = new Set(['completed', 'rejected', 'cancelled'])
const hideChat = vi.fn(async (_chatId: string, _uid: string) => {})

vi.mock('@/features/chat/api', () => ({
  subscribeToChats: (_uid: string, onChange: (c: Chat[]) => void, onError: () => void) => {
    emit = onChange
    fail = onError
    return () => {}
  },
  canHideChat: (chat: Chat) => chat.requestStatus !== null && CLOSED.has(chat.requestStatus),
  hideChat: (...args: [string, string]) => hideChat(...args),
}))

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: ME }, profile: { uid: ME, displayName: 'Yo' } }),
}))
vi.mock('@/features/notifications/NotificationsBell', () => ({ NotificationsBell: () => null }))

const { ChatsPage } = await import('@/pages/ChatsPage')

function chat(overrides: Partial<Chat> = {}) {
  return {
    id: 'chat-1',
    participantIds: [ME, 'otro'],
    participants: { otro: { displayName: 'Ana Gómez', photoURL: null } },
    categoryId: 'plomero',
    lastMessage: 'Hola',
    unreadCount: {},
    requestStatus: 'pending',
    hiddenFor: [],
    ...overrides,
  } as unknown as Chat
}

function show() {
  render(
    <MemoryRouter>
      <ChatsPage />
    </MemoryRouter>,
  )
}

describe('pantalla de chats', () => {
  beforeEach(() => hideChat.mockClear())

  it('si el listener falla lo dice, en vez de girar el spinner para siempre', async () => {
    show()
    fail()

    expect(await screen.findByText(/No pudimos cargar tus chats/)).toBeInTheDocument()
    // Y no finge que la casilla está vacía.
    expect(screen.queryByText('No tenés conversaciones')).not.toBeInTheDocument()
  })

  it('muestra las conversaciones que llegan', async () => {
    show()
    emit([chat()])

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
  })

  it('con el trabajo en marcha no se puede eliminar la conversación', async () => {
    show()
    emit([chat({ requestStatus: 'in_progress' })])

    await screen.findByText('Ana Gómez')
    expect(screen.queryByRole('button', { name: /Eliminar la conversación/ })).toBeNull()
  })

  it('con el trabajo cerrado se elimina, previa confirmación', async () => {
    show()
    emit([chat({ requestStatus: 'completed' })])

    await userEvent.click(await screen.findByRole('button', { name: /Eliminar la conversación/ }))
    // Hasta acá no se tocó nada: primero hay que confirmar.
    expect(hideChat).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(hideChat).toHaveBeenCalledWith('chat-1', ME)
  })
})
