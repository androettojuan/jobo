import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Locality } from '@/types/models'

const CATALOGO: Locality[] = [
  { id: 'cordoba-cordoba', name: 'Córdoba', province: 'Córdoba', lat: -31.4, lng: -64.18 },
  { id: 'las-corzuelas-cordoba', name: 'Las Corzuelas', province: 'Córdoba', lat: -32, lng: -64 },
  { id: 'rosario-santa-fe', name: 'Rosario', province: 'Santa Fe', lat: -32.95, lng: -60.65 },
]

vi.mock('@/features/localities/useLocalities', () => ({
  useLocalities: () => ({ localities: CATALOGO, loading: false }),
}))

const { LocalitySelect } = await import('@/features/localities/LocalitySelect')

describe('selector de localidad', () => {
  it('encuentra la ciudad escribiendo, sin acentos', async () => {
    const onChange = vi.fn()
    render(<LocalitySelect value={null} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: /Elegí tu localidad/ }))
    await userEvent.type(screen.getByLabelText('Buscar localidad'), 'rosari')

    await userEvent.click(await screen.findByRole('option', { name: /Rosario/ }))
    expect(onChange).toHaveBeenCalledWith(CATALOGO[2])
  })

  it('lo que empieza con lo tecleado va primero', async () => {
    render(<LocalitySelect value={null} onChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /Elegí tu localidad/ }))
    await userEvent.type(screen.getByLabelText('Buscar localidad'), 'cor')

    // "Córdoba" empieza con lo tecleado; "Las Corzuelas" solo lo contiene.
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Córdoba')
    expect(options[1]).toHaveTextContent('Las Corzuelas')
  })

  it('la provincia acompaña al nombre, para distinguir homónimas', async () => {
    render(<LocalitySelect value="rosario-santa-fe" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Rosario/ })).toHaveTextContent('Santa Fe')
  })
})
