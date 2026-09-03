import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/auth/api', () => ({
  loginWithGoogle: async () => ({ isNew: false }),
  loginWithApple: async () => ({ isNew: false }),
}))

vi.mock('@/lib/platform', () => ({ isIOS: false }))

const { ProviderButtons } = await import('@/features/auth/components/ProviderButtons')

describe('botones de proveedor', () => {
  it('el botón tocado muestra que está trabajando', async () => {
    // Entrar con Google tarda: canje de token y lectura del perfil. Si el
    // botón solo se apaga, dos segundos de pantalla quieta se leen como una
    // app colgada.
    const { rerender } = render(<ProviderButtons disabled={false} onRun={() => {}} />)

    const google = screen.getByRole('button', { name: /continuar con google/i })
    expect(google.querySelector('.animate-spin')).toBeNull()

    await userEvent.click(google)
    rerender(<ProviderButtons disabled onRun={() => {}} />)

    expect(
      screen.getByRole('button', { name: /continuar con google/i }).querySelector('.animate-spin'),
    ).not.toBeNull()
  })

  it('sin haber tocado nada, deshabilitar no pone a girar nada', () => {
    // La pantalla de registro los deshabilita hasta que se aceptan los
    // términos: ahí no hay nada cargando.
    render(<ProviderButtons disabled onRun={() => {}} />)

    expect(
      screen.getByRole('button', { name: /continuar con google/i }).querySelector('.animate-spin'),
    ).toBeNull()
  })
})
