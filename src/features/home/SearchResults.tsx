import { SearchX, X } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { ProfessionalListSkeleton } from '@/components/ui/skeletons'
import { ProfessionalCard } from '@/features/professionals/components/ProfessionalCard'
import type { Category, LocalityRef, Professional } from '@/types/models'

interface SearchResultsProps {
  results: Professional[]
  loading: boolean
  error: string | null
  locality: LocalityRef | null
  /** Rubro elegido, si lo hay: se muestra como chip que se puede quitar. */
  category?: Category
  onClearCategory: () => void
}

/** Lo que ocupa el lugar de la grilla de oficios mientras se está buscando. */
export function SearchResults({
  results,
  loading,
  error,
  locality,
  category,
  onClearCategory,
}: SearchResultsProps) {
  return (
    <section>
      {category && (
        <button
          type="button"
          onClick={onClearCategory}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm text-white"
        >
          {category.name}
          <X className="size-4" aria-hidden />
          <span className="sr-only">Quitar el filtro de rubro</span>
        </button>
      )}

      {loading && <ProfessionalListSkeleton />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description={
            locality
              ? `No encontramos a nadie en ${locality.name}. Probá con otras palabras o cambiá de localidad.`
              : 'No encontramos a nadie. Probá con otras palabras.'
          }
        />
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {results.length === 1 ? '1 resultado' : `${results.length} resultados`}
          </p>
          <ul className="flex flex-col gap-3">
            {results.map((professional) => (
              <li key={professional.uid}>
                <ProfessionalCard professional={professional} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
