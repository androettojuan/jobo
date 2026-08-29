import { Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ProfessionalCard } from '@/features/professionals/components/ProfessionalCard'
import { filterByText, searchProfessionals } from '@/features/professionals/api'
import { LocalityPicker } from '@/features/localities/LocalityPicker'
import { useLocalityStore } from '@/features/localities/store'
import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { Professional } from '@/types/models'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('categoria') ?? ''
  const locality = useLocalityStore((s) => s.locality)
  const [results, setResults] = useState<Professional[]>([])
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    searchProfessionals({
      categoryId: categoryId || undefined,
      localityId: locality?.id,
    })
      .then((list) => {
        if (!cancelled) setResults(list)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar los profesionales. Probá de nuevo.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [categoryId, locality?.id])

  const visible = filterByText(results, term)

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Buscar</h1>

      <LocalityPicker />

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="¿Qué necesitás resolver?"
          aria-label="Buscar profesionales"
          className="h-12 w-full rounded-xl border border-slate-300 pr-4 pl-11 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((category) => {
          const active = category.id === categoryId
          return (
            <button
              key={category.id}
              onClick={() => setParams(active ? {} : { categoria: category.id })}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 hover:border-brand-500 dark:border-slate-700',
              )}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      {loading && <Spinner />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={term ? 'Sin resultados' : 'Todavía no hay profesionales'}
          description={
            term
              ? `Nadie coincide con “${term}”. Probá con otras palabras.`
              : locality
                ? `Todavía nadie ofrece este servicio en ${locality.name}. Probá sacando el filtro de localidad.`
                : 'Cuando haya profesionales en esta categoría los vas a ver acá.'
          }
        />
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((professional) => (
          <li key={professional.uid}>
            <ProfessionalCard professional={professional} />
          </li>
        ))}
      </ul>
    </div>
  )
}
