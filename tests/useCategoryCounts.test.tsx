import { renderHook, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Guarda el callback del `onSnapshot` para dispararlo cuando el test quiera. */
let emitir: ((snap: { data: () => unknown }) => void) | null = null

vi.mock('firebase/firestore', () => ({
  doc: () => ({}),
  onSnapshot: (_ref: unknown, next: (snap: { data: () => unknown }) => void) => {
    emitir = next
    return () => {}
  },
}))

vi.mock('@/lib/firebase', () => ({ db: {} }))

const { useCategoryCounts } = await import('@/features/professionals/useCategoryCounts')

const CONTEOS = { total: { plomero: 3 }, byLocality: { 'villa-rumipal': { plomero: 2 } } }

afterEach(() => {
  localStorage.clear()
  emitir = null
})

describe('conteos por oficio', () => {
  it('la primera vez arranca vacío: no hay nada que recordar', () => {
    const { result } = renderHook(() => useCategoryCounts('villa-rumipal'))

    expect(result.current.empty).toBe(true)
    expect(result.current.counts).toEqual({})
  })

  it('guarda lo que llega del servidor', () => {
    renderHook(() => useCategoryCounts('villa-rumipal'))
    act(() => emitir?.({ data: () => CONTEOS }))

    expect(JSON.parse(localStorage.getItem('jobo:category-counts:v1')!)).toEqual(CONTEOS)
  })

  it('en el arranque siguiente ya tiene los números, sin esperar a Firestore', () => {
    localStorage.setItem('jobo:category-counts:v1', JSON.stringify(CONTEOS))

    // Sin emitir nada: es el primer pintado, Firestore todavía no contestó.
    const { result } = renderHook(() => useCategoryCounts('villa-rumipal'))

    // Con `empty` en true la grilla sale sin leyendas y en otro orden, y se
    // reacomoda sola al llegar los datos. Eso es el parpadeo que se veía.
    expect(result.current.empty).toBe(false)
    expect(result.current.counts).toEqual({ plomero: 2 })
  })

  it('un localStorage corrupto no rompe la home', () => {
    localStorage.setItem('jobo:category-counts:v1', 'esto no es json')

    const { result } = renderHook(() => useCategoryCounts('villa-rumipal'))

    expect(result.current.empty).toBe(true)
  })

  it('un JSON válido pero con otra forma tampoco', () => {
    localStorage.setItem('jobo:category-counts:v1', '{"otra":"cosa"}')

    const { result } = renderHook(() => useCategoryCounts('villa-rumipal'))

    expect(result.current.empty).toBe(true)
  })
})
