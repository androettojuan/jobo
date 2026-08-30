import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { jobRequest, ME, OTHER } from './factories'
import type { JobRequest } from '@/types/models'

/** Lo que devolvería el listener de Firestore, sin Firestore de por medio. */
let emit: (requests: JobRequest[]) => void
let fail: () => void

vi.mock('@/features/requests/api', async () => {
  const actual = await vi.importActual<typeof import('@/features/requests/api')>(
    '@/features/requests/api',
  )
  return {
    ...actual,
    subscribeToRequests: (
      _uid: string,
      onChange: (r: JobRequest[]) => void,
      onError: () => void,
    ) => {
      emit = onChange
      fail = onError
      return () => {}
    },
  }
})

let isProfessional = true

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: ME },
    profile: { uid: ME, displayName: 'Yo', isProfessional },
  }),
}))

vi.mock('@/features/notifications/NotificationsBell', () => ({
  NotificationsBell: () => null,
}))

const { RequestsPage } = await import('@/pages/RequestsPage')

function show() {
  render(
    <MemoryRouter>
      <RequestsPage />
    </MemoryRouter>,
  )
}

/** Dos que pedí (una abierta, una cerrada) y dos que me pidieron. */
const SAMPLE = [
  jobRequest({ id: 'a', title: 'Canilla que pierde', status: 'accepted' }),
  jobRequest({ id: 'b', title: 'Poda vieja', status: 'completed' }),
  jobRequest({ id: 'c', title: 'Destapar cocina', clientId: OTHER, professionalId: ME }),
  jobRequest({
    id: 'd',
    title: 'Trabajo cancelado',
    clientId: OTHER,
    professionalId: ME,
    status: 'cancelled',
  }),
]

beforeEach(() => {
  isProfessional = true
})

describe('pantalla de solicitudes', () => {
  it('separa lo que pedí de lo que me pidieron', async () => {
    show()
    emit(SAMPLE)

    // Arranca en "Pedí": la de otro rol no tiene por qué estar.
    expect(await screen.findByText('Canilla que pierde')).toBeInTheDocument()
    expect(screen.queryByText('Destapar cocina')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Me pidieron/ }))

    expect(screen.getByText('Destapar cocina')).toBeInTheDocument()
    expect(screen.queryByText('Canilla que pierde')).not.toBeInTheDocument()
  })

  it('cuenta solo lo que sigue abierto', async () => {
    show()
    emit(SAMPLE)

    // Una abierta de cada lado; las cerradas no suman.
    const pedi = await screen.findByRole('button', { name: /Pedí/ })
    expect(within(pedi).getByText('1')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: /Me pidieron/ })).getByText('1')).toBeInTheDocument()
  })

  it('deja lo cerrado plegado y fuera del camino', async () => {
    show()
    emit(SAMPLE)

    expect(await screen.findByText('Cerradas (1)')).toBeInTheDocument()
    // El detalle está cerrado: el título existe pero no es visible.
    expect(screen.getByText('Poda vieja')).not.toBeVisible()

    await userEvent.click(screen.getByText('Cerradas (1)'))
    expect(screen.getByText('Poda vieja')).toBeVisible()
  })

  it('si falla la carga lo dice, en vez de fingir que no hay nada', async () => {
    show()
    fail()

    expect(await screen.findByText(/No pudimos cargar tus solicitudes/)).toBeInTheDocument()
    expect(screen.queryByText('No pediste ningún presupuesto')).not.toBeInTheDocument()
  })

  it('al vecino que no ofrece servicios no le muestra pestañas', async () => {
    isProfessional = false
    show()
    emit([SAMPLE[0]!])

    expect(await screen.findByText('Canilla que pierde')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Me pidieron/ })).not.toBeInTheDocument()
  })
})
