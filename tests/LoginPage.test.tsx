import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** La sesión aparece a mitad del ingreso, como en la vida real. */
let auth = { firebaseUser: null as unknown, loading: false }
vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => auth }))

/**
 * Cada test decide qué hace el login con Google: si crea la cuenta o solo
 * entra, y —para la carrera— cuándo termina.
 */
let entrarConGoogleReal: () => Promise<{ isNew: boolean }>

vi.mock('@/features/auth/api', () => ({
  loginWithEmail: async () => ({ uid: 'u1' }),
  loginWithGoogle: () => entrarConGoogleReal(),
  loginWithApple: () => entrarConGoogleReal(),
  authErrorMessage: () => 'error',
}))

const { LoginPage } = await import('@/pages/LoginPage')

const devuelve = (resultado: { isNew: boolean }) => {
  entrarConGoogleReal = async () => resultado
}

/**
 * Se monta el router de verdad y se mira la ruta resultante, en vez de espiar
 * `useNavigate`. La pantalla tiene dos formas de mover a alguien —su `navigate`
 * y un `<Navigate>` de guarda— y con el espía la segunda es invisible, que es
 * justo la que causó el problema.
 */
function Ubicacion() {
  return <span data-testid="ruta">{useLocation().pathname}</span>
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Ubicacion />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  )
}

const ruta = () => screen.getByTestId('ruta').textContent

afterEach(() => {
  auth = { firebaseUser: null, loading: false }
})

describe('entrar', () => {
  it('quien vuelve entra a la app', async () => {
    devuelve({ isNew: false })
    montar()

    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    await waitFor(() => expect(ruta()).toBe('/'))
  })

  it('a quien recién crea la cuenta se le pregunta a qué vino', async () => {
    // Con Google, "entrar" y "registrarse" son el mismo botón: sin esto,
    // quien llega por acá nunca ve la pregunta del registro.
    devuelve({ isNew: true })
    montar()

    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    await waitFor(() => expect(ruta()).toBe('/bienvenida'))
  })

  it('con email no hay cuenta nueva posible: siempre entra a la app', async () => {
    devuelve({ isNew: false })
    montar()

    await userEvent.type(screen.getByLabelText('Email'), 'ana@test.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'jobo123456')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(ruta()).toBe('/'))
  })
})

describe('la sesión que aparece a mitad del ingreso', () => {
  it('no manda a la app antes de que se decida a dónde ir', async () => {
    // Firebase confirma la sesión antes de que termine `loginWithGoogle`, y el
    // perfil llega enseguida porque la escritura se aplica local. Si el guarda
    // de "ya tenés sesión" no espera, redirige a la home y a quien recién crea
    // la cuenta nunca se le pregunta a qué vino.
    let resolver: (valor: { isNew: boolean }) => void = () => {}
    entrarConGoogleReal = () =>
      new Promise<{ isNew: boolean }>((r) => {
        resolver = r
      })

    const { rerender } = montar()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    auth = { firebaseUser: { uid: 'u1' }, loading: false }
    rerender(
      <MemoryRouter initialEntries={['/login']}>
        <Ubicacion />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={null} />
        </Routes>
      </MemoryRouter>,
    )

    // Con el ingreso todavía en curso, el guarda no tiene que mover a nadie.
    expect(ruta()).toBe('/login')

    resolver({ isNew: true })

    await waitFor(() => expect(ruta()).toBe('/bienvenida'))
  })

  it('a quien abre /login ya con sesión sí lo saca de ahí', async () => {
    devuelve({ isNew: false })
    auth = { firebaseUser: { uid: 'u1' }, loading: false }
    montar()

    // El guarda sigue existiendo: no hay formulario que mostrar.
    await waitFor(() => expect(ruta()).toBe('/'))
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  })
})
