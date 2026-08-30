import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ME } from './factories'
import type { AppNotification } from '@/types/models'

let emit: (list: AppNotification[]) => void
let fail: () => void
const cleared = vi.fn()
let clearFails = false

vi.mock('@/features/notifications/api', () => ({
  subscribeToNotifications: (
    _uid: string,
    onChange: (l: AppNotification[]) => void,
    onError: () => void,
  ) => {
    emit = onChange
    fail = onError
    return () => {}
  },
  clearNotifications: (uid: string) => {
    cleared(uid)
    return clearFails ? Promise.reject(new Error('no')) : Promise.resolve()
  },
  markNotificationRead: () => Promise.resolve(),
  enablePushNotifications: () => Promise.reject(new PushErrorStub()),
  PushError: class {},
}))

class PushErrorStub {}

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: ME }, profile: { uid: ME, displayName: 'Yo' } }),
}))

const { NotificationsPage } = await import('@/pages/NotificationsPage')

const AVISO: AppNotification = {
  id: 'chat-chat-1',
  type: 'message_received',
  title: 'Ana Gómez',
  body: 'Te escribió un mensaje',
  link: '/chats/chat-1',
  read: false,
} as AppNotification

function show() {
  render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cleared.mockClear()
  clearFails = false
})

describe('pantalla de avisos', () => {
  it('pide confirmación antes de borrar, y recién ahí borra', async () => {
    show()
    emit([AVISO])

    await userEvent.click(await screen.findByRole('button', { name: /Limpiar/ }))
    expect(cleared).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /Confirmar/ }))
    expect(cleared).toHaveBeenCalledWith(ME)
  })

  it('avisa si el borrado falla, en vez de callárselo', async () => {
    clearFails = true
    show()
    emit([AVISO])

    await userEvent.click(await screen.findByRole('button', { name: /Limpiar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Confirmar/ }))

    expect(await screen.findByText(/No pudimos borrar los avisos/)).toBeInTheDocument()
  })

  it('sin avisos no ofrece limpiar nada', async () => {
    show()
    emit([])

    expect(await screen.findByText('No tenés novedades')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Limpiar/ })).not.toBeInTheDocument()
  })

  it('si el listener falla no se queda cargando para siempre', async () => {
    show()
    fail()

    expect(await screen.findByText(/No pudimos cargar tus avisos/)).toBeInTheDocument()
  })
})
