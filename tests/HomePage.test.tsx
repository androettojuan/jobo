import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Professional } from '@/types/models'

const professional = (over: Partial<Professional> & { uid: string }): Professional =>
  ({
    displayName: 'Ana Gómez',
    photoURL: null,
    categoryIds: ['jardineria-y-poda'],
    headline: 'Jardinería y poda',
    description: 'Corte de césped y poda de altura',
    locality: null,
    serviceAreaIds: ['villa-rumipal'],
    hourlyRateFrom: null,
    hourlyRateTo: null,
    photos: [],
    publicPhone: null,
    status: 'active',
    verified: false,
    ratingAvg: 4.8,
    ratingCount: 4,
    completedJobs: 2,
    avgResponseMs: null,
    ...over,
  }) as Professional

/** Cada test decide qué devuelve la búsqueda y cuándo. */
let search: (args: unknown) => Promise<Professional[]>

vi.mock('@/features/professionals/api', async () => {
  const actual = await vi.importActual<typeof import('@/features/professionals/api')>(
    '@/features/professionals/api',
  )
  return { ...actual, searchProfessionals: (args: unknown) => search(args) }
})

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: null, profile: null }),
}))
vi.mock('@/features/localities/LocalityPicker', () => ({ LocalityPicker: () => null }))
vi.mock('@/features/localities/store', () => ({
  useLocalityStore: (selector: (s: unknown) => unknown) => selector({ locality: null }),
}))
vi.mock('@/features/professionals/useCategoryCounts', () => ({
  useCategoryCounts: () => ({ counts: {}, empty: true }),
}))

const { HomePage } = await import('@/pages/HomePage')

function show(route = '/') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <HomePage />
    </MemoryRouter>,
  )
}

const ANA = professional({ uid: 'ana' })

beforeEach(() => {
  search = () => Promise.resolve([ANA])
})

describe('buscar desde la home', () => {
  it('los resultados reemplazan a los rubros y volver a vaciar los trae de vuelta', async () => {
    show()
    expect(screen.getByText('Hogar y arreglos')).toBeInTheDocument()

    const input = screen.getByLabelText('Buscar profesionales')
    await userEvent.type(input, 'poda')

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
    expect(screen.queryByText('Hogar y arreglos')).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Limpiar la búsqueda'))
    expect(screen.getByText('Hogar y arreglos')).toBeInTheDocument()
  })

  it('filtra por rubro sin salir de la home', async () => {
    show()
    await userEvent.click(screen.getByRole('button', { name: /Jardinería/ }))

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
    // El chip permite deshacer el filtro y volver a la grilla.
    await userEvent.click(screen.getByRole('button', { name: /Quitar el filtro de rubro/ }))
    expect(screen.getByText('Hogar y arreglos')).toBeInTheDocument()
  })

  it('toma el rubro de la URL, para los enlaces que apuntaban a /buscar', async () => {
    show('/?categoria=jardineria-y-poda')
    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
  })

  it('no dice "sin resultados" mientras todavía está buscando', async () => {
    let resolve: (list: Professional[]) => void = () => {}
    search = () => new Promise((r) => (resolve = r))

    show()
    await userEvent.type(screen.getByLabelText('Buscar profesionales'), 'poda')
    expect(screen.queryByText('Sin resultados')).not.toBeInTheDocument()

    resolve([])
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
  })

  it('si la búsqueda se abandona a mitad de camino, la siguiente no queda colgada', async () => {
    // Regresión: la consulta cancelada se daba por cargada y la pantalla
    // quedaba en el spinner para siempre.
    const pending: ((list: Professional[]) => void)[] = []
    search = () => new Promise<Professional[]>((r) => pending.push(r))

    show()
    await userEvent.click(screen.getByRole('button', { name: /Jardinería/ }))
    await userEvent.click(screen.getByRole('button', { name: /Quitar el filtro de rubro/ }))

    // La primera consulta responde tarde, cuando ya nadie la espera.
    pending[0]?.([ANA])
    search = () => Promise.resolve([ANA])

    await userEvent.click(screen.getByRole('button', { name: /Jardinería/ }))
    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
  })
})
