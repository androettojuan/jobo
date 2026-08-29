import { SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ProfessionalCard } from '@/features/professionals/components/ProfessionalCard'
import { searchProfessionals } from '@/features/professionals/api'
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Buscar</h1>

      <LocalityPicker />

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

      {!loading && !error && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Todavía no hay profesionales"
          description={
            locality
              ? `Todavía nadie ofrece este servicio en ${locality.name}. Probá sacando el filtro de localidad.`
              : 'Cuando haya profesionales en esta categoría los vas a ver acá.'
          }
        />
      )}

      <ul className="flex flex-col gap-3">
        {results.map((professional) => (
          <li key={professional.uid}>
            <ProfessionalCard professional={professional} />
          </li>
        ))}
      </ul>
    </div>
  )
}
