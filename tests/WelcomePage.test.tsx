import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const navegar = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navegar }
})

let auth: { profile: unknown; loading: boolean }
vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => auth }))

const { WelcomePage } = await import('@/pages/WelcomePage')

function mostrar() {
  render(
    <MemoryRouter>
      <WelcomePage />
    </MemoryRouter>,
  )
}

afterEach(() => navegar.mockClear())

describe('bienvenida', () => {
  it('saluda por el nombre de pila', () => {
    auth = { profile: { displayName: 'Ana Gómez', isProfessional: false }, loading: false }
    mostrar()

    expect(screen.getByRole('heading', { name: 'Hola, Ana' })).toBeInTheDocument()
  })

  it('quien busca a alguien entra a la app', async () => {
    auth = { profile: { displayName: 'Ana', isProfessional: false }, loading: false }
    mostrar()

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(navegar).toHaveBeenCalledWith('/', { replace: true })
  })

  it('quien ofrece servicios pasa a completar su perfil', async () => {
    auth = { profile: { displayName: 'Ana', isProfessional: false }, loading: false }
    mostrar()

    await userEvent.click(screen.getByRole('button', { name: /ofrezco mis servicios/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(navegar).toHaveBeenCalledWith('/perfil/profesional?alta=1', { replace: true })
  })

  it('a quien ya tiene perfil profesional no se le pregunta nada', () => {
    auth = { profile: { displayName: 'Ana', isProfessional: true }, loading: false }
    mostrar()

    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument()
  })
})
