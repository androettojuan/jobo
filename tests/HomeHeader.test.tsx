import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HomeHeader } from '@/features/home/HomeHeader'
import { writeSignedInHint } from '@/features/auth/sessionHints'

// La campana se suscribe a Firestore; acá solo interesa si se dibuja o no.
vi.mock('@/features/notifications/NotificationsBell', () => ({
  NotificationsBell: () => <span>Notificaciones</span>,
}))

function mostrar(props: { signedIn: boolean; loading: boolean }) {
  render(
    <MemoryRouter>
      <HomeHeader {...props} profile={null} />
    </MemoryRouter>,
  )
}

const hayCampana = () => screen.queryByText('Notificaciones') !== null
const hayEnlaceEntrar = () => screen.queryByRole('link', { name: 'Iniciar sesión' }) !== null

afterEach(() => localStorage.clear())

describe('encabezado de la home', () => {
  it('mientras carga, muestra lo que había la última vez en este teléfono', () => {
    writeSignedInHint(true)
    // Firebase todavía no contestó: `signedIn` es false pero no significa
    // "no hay sesión", significa "no sé". Sin la pista, acá aparecería
    // "Iniciar sesión" y saltaría a la campana un instante después.
    mostrar({ signedIn: false, loading: true })

    expect(hayCampana()).toBe(true)
    expect(hayEnlaceEntrar()).toBe(false)
  })

  it('sin sesión previa en el teléfono, ofrece entrar desde el primer pintado', () => {
    writeSignedInHint(false)
    mostrar({ signedIn: false, loading: true })

    expect(hayEnlaceEntrar()).toBe(true)
    expect(hayCampana()).toBe(false)
  })

  it('cuando Firebase contesta, manda el dato real y no la pista', () => {
    writeSignedInHint(true)
    mostrar({ signedIn: false, loading: false })

    expect(hayEnlaceEntrar()).toBe(true)
    expect(hayCampana()).toBe(false)
  })

  it('con sesión iniciada muestra la campana', () => {
    mostrar({ signedIn: true, loading: false })

    expect(hayCampana()).toBe(true)
    expect(hayEnlaceEntrar()).toBe(false)
  })
})
