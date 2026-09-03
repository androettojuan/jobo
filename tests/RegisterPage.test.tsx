import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const navegar = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navegar }
})

vi.mock('@/features/auth/api', () => ({
  registerWithEmail: async () => ({ uid: 'u1' }),
  authErrorMessage: () => 'error',
}))

vi.mock('@/features/auth/components/ProviderButtons', () => ({
  ProviderButtons: () => null,
}))

const { RegisterPage } = await import('@/pages/RegisterPage')

async function completarYEnviar(rol: RegExp) {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )

  await userEvent.click(screen.getByRole('button', { name: rol }))
  await userEvent.type(screen.getByLabelText('Nombre y apellido'), 'Ana')
  await userEvent.type(screen.getByLabelText('Email'), 'ana@test.com')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'jobo123456')
  await userEvent.click(screen.getByRole('checkbox'))
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

afterEach(() => navegar.mockClear())

describe('registro', () => {
  it('quien busca a alguien entra directo a la app', async () => {
    await completarYEnviar(/busco a alguien/i)

    expect(navegar).toHaveBeenCalledWith('/', { replace: true })
  })

  it('quien ofrece servicios pasa por completar su perfil profesional', async () => {
    await completarYEnviar(/ofrezco mis servicios/i)

    // Sin oficios ni zona no aparece en ninguna búsqueda: mandarlo a la home
    // lo dejaría registrado y a la vez invisible.
    expect(navegar).toHaveBeenCalledWith('/perfil/profesional?alta=1', { replace: true })
  })

  it('arranca en "busco a alguien", que es el caso común', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /busco a alguien/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
