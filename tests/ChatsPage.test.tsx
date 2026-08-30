import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ME } from './factories'
import type { Chat } from '@/types/models'

let emit: (chats: Chat[]) => void
let fail: () => void

vi.mock('@/features/chat/api', () => ({
  subscribeToChats: (_uid: string, onChange: (c: Chat[]) => void, onError: () => void) => {
    emit = onChange
    fail = onError
    return () => {}
  },
}))

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: ME }, profile: { uid: ME, displayName: 'Yo' } }),
}))
vi.mock('@/features/notifications/NotificationsBell', () => ({ NotificationsBell: () => null }))

const { ChatsPage } = await import('@/pages/ChatsPage')

function show() {
  render(
    <MemoryRouter>
      <ChatsPage />
    </MemoryRouter>,
  )
}

describe('pantalla de chats', () => {
  it('si el listener falla lo dice, en vez de girar el spinner para siempre', async () => {
    show()
    fail()

    expect(await screen.findByText(/No pudimos cargar tus chats/)).toBeInTheDocument()
    // Y no finge que la casilla está vacía.
    expect(screen.queryByText('No tenés conversaciones')).not.toBeInTheDocument()
  })

  it('muestra las conversaciones que llegan', async () => {
    show()
    emit([
      {
        id: 'chat-1',
        participantIds: [ME, 'otro'],
        participants: { otro: { displayName: 'Ana Gómez', photoURL: null } },
        categoryId: 'plomero',
        lastMessage: 'Hola',
        unreadCount: {},
      } as unknown as Chat,
    ])

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
  })
})
