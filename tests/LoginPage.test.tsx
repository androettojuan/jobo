import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const navegar = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navegar }
})

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: null, loading: false }),
}))

/** Cada test decide si el login con Google crea la cuenta o solo entra. */
let resultadoGoogle: { isNew: boolean }

vi.mock('@/features/auth/api', () => ({
  loginWithEmail: async () => ({ uid: 'u1' }),
  loginWithGoogle: async () => resultadoGoogle,
  loginWithApple: async () => resultadoGoogle,
  authErrorMessage: () => 'error',
}))

const { LoginPage } = await import('@/pages/LoginPage')

async function entrarConGoogle() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }))
}

afterEach(() => navegar.mockClear())

describe('entrar', () => {
  it('quien vuelve entra a la app', async () => {
    resultadoGoogle = { isNew: false }
    await entrarConGoogle()

    expect(navegar).toHaveBeenCalledWith('/', { replace: true })
  })

  it('a quien recién crea la cuenta se le pregunta a qué vino', async () => {
    // Con Google, "entrar" y "registrarse" son el mismo botón: sin esto,
    // quien llega por acá nunca ve la pregunta del registro.
    resultadoGoogle = { isNew: true }
    await entrarConGoogle()

    expect(navegar).toHaveBeenCalledWith('/bienvenida', { replace: true })
  })

  it('con email no hay cuenta nueva posible: siempre entra a la app', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Email'), 'ana@test.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'jobo123456')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(navegar).toHaveBeenCalledWith('/', { replace: true })
  })
})
