import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ME } from './factories'

let auth: { firebaseUser: unknown; profile: unknown; loading: boolean }

vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => auth }))
vi.mock('@/features/chat/useUnreadChats', () => ({ useUnreadChats: () => 0 }))
vi.mock('@/features/notifications/ForegroundToast', () => ({ ForegroundToast: () => null }))
vi.mock('@/features/pwa/InstallPrompt', () => ({ InstallPrompt: () => null }))
vi.mock('@/features/pwa/UpdatePrompt', () => ({ UpdatePrompt: () => null }))

const { AppLayout } = await import('@/app/AppLayout')

function show() {
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  )
}

afterEach(() => localStorage.clear())

describe('barra de navegación', () => {
  it('el vecino no ve la pestaña de trabajo', () => {
    auth = { firebaseUser: { uid: ME }, profile: { isProfessional: false }, loading: false }
    show()

    expect(screen.queryByText('Mi trabajo')).toBeNull()
  })

  it('quien ofrece servicios sí la ve', () => {
    auth = { firebaseUser: { uid: ME }, profile: { isProfessional: true }, loading: false }
    show()

    expect(screen.getByText('Mi trabajo')).toBeInTheDocument()
  })

  it('mientras carga el perfil se guía por la sesión anterior, sin saltar de 4 a 5', () => {
    localStorage.setItem('jobo:is-professional', '1')
    auth = { firebaseUser: { uid: ME }, profile: null, loading: true }
    show()

    // El perfil todavía no llegó y la pestaña ya está: la barra no se redibuja.
    expect(screen.getByText('Mi trabajo')).toBeInTheDocument()
  })

  it('sin nada recordado no inventa la pestaña', () => {
    auth = { firebaseUser: null, profile: null, loading: true }
    show()

    expect(screen.queryByText('Mi trabajo')).toBeNull()
  })
})
