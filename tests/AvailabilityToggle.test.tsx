import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Cada test decide si el guardado anda o falla. */
let guardar: (uid: string, status: string) => Promise<void>
const llamadas: { uid: string; status: string }[] = []

vi.mock('@/features/professionals/profileApi', () => ({
  setProfessionalStatus: (uid: string, status: string) => {
    llamadas.push({ uid, status })
    return guardar(uid, status)
  },
}))

const { AvailabilityToggle } =
  await import('@/features/professionals/components/AvailabilityToggle')

function mostrar(status: 'active' | 'paused') {
  const onChange = vi.fn()
  render(<AvailabilityToggle uid="u1" status={status} onChange={onChange} />)
  return onChange
}

afterEach(() => {
  llamadas.length = 0
})

describe('disponibilidad del profesional', () => {
  it('disponible: explica que aparece en las búsquedas y ofrece pausar', () => {
    guardar = async () => {}
    mostrar('active')

    expect(screen.getByText('Estás disponible')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pausa/i })).toBeInTheDocument()
  })

  it('en pausa: aclara que los chats y las solicitudes no se tocan', () => {
    guardar = async () => {}
    mostrar('paused')

    expect(screen.getByText('Estás en pausa')).toBeInTheDocument()
    expect(screen.getByText(/tus chats/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver a estar disponible/i })).toBeInTheDocument()
  })

  it('pausar guarda el estado nuevo', async () => {
    guardar = async () => {}
    const onChange = mostrar('active')

    await userEvent.click(screen.getByRole('button', { name: /pausa/i }))

    expect(llamadas).toEqual([{ uid: 'u1', status: 'paused' }])
    expect(onChange).toHaveBeenCalledWith('paused')
  })

  it('si el guardado falla, el interruptor vuelve a donde estaba', async () => {
    guardar = async () => {
      throw new Error('sin red')
    }
    const onChange = mostrar('active')

    await userEvent.click(screen.getByRole('button', { name: /pausa/i }))

    // Primero se pinta el cambio, y al fallar se deshace: quedarse mostrando
    // "en pausa" cuando el servidor no se enteró es peor que no moverse.
    await waitFor(() => expect(screen.getByText(/no pudimos cambiarlo/i)).toBeInTheDocument())
    expect(onChange).toHaveBeenNthCalledWith(1, 'paused')
    expect(onChange).toHaveBeenNthCalledWith(2, 'active')
  })
})
