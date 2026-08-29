import { describe, expect, it } from 'vitest'

import { filterByText } from '@/features/professionals/api'
import type { Professional } from '@/types/models'

/** Perfil mínimo: solo lo que mira el filtro de texto. */
function pro(overrides: Partial<Professional>): Professional {
  return {
    displayName: 'Ana Gómez',
    headline: 'Jardinera y electricista del valle',
    description: 'Mantenimiento de jardines e instalaciones eléctricas.',
    categoryIds: ['jardineria', 'electricista'],
    ...overrides,
  } as Professional
}

describe('filterByText', () => {
  const lista = [
    pro({}),
    pro({
      displayName: 'Carlos Pérez',
      headline: 'Plomero matriculado',
      description: 'Destapaciones y arreglo de pérdidas.',
      categoryIds: ['plomero'],
    }),
  ]

  it('sin término devuelve todo', () => {
    expect(filterByText(lista, '')).toHaveLength(2)
    expect(filterByText(lista, '   ')).toHaveLength(2)
  })

  it('encuentra por oficio', () => {
    expect(filterByText(lista, 'plomero')).toHaveLength(1)
  })

  it('ignora mayúsculas', () => {
    expect(filterByText(lista, 'PLOMERO')).toHaveLength(1)
  })

  it('ignora acentos en ambos lados', () => {
    expect(filterByText(lista, 'perez')).toHaveLength(1)
    expect(filterByText(lista, 'eléctricas')).toHaveLength(1)
  })

  it('exige todas las palabras, aunque estén en campos distintos', () => {
    // "ana" está en el nombre y "valle" en el título.
    expect(filterByText(lista, 'ana valle')).toHaveLength(1)
    expect(filterByText(lista, 'ana plomero')).toHaveLength(0)
  })

  it('no inventa coincidencias', () => {
    expect(filterByText(lista, 'gasista')).toHaveLength(0)
  })
})
