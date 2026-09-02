import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { CategoryGrid } from '@/features/home/CategoryGrid'
import { HomeHeader } from '@/features/home/HomeHeader'
import { SearchField } from '@/features/home/SearchField'
import { SearchResults } from '@/features/home/SearchResults'
import { LocalityPicker } from '@/features/localities/LocalityPicker'
import { useLocalityStore } from '@/features/localities/store'
import { useCategoryCounts } from '@/features/professionals/useCategoryCounts'
import { useProfessionalSearch } from '@/features/professionals/useProfessionalSearch'
import { CATEGORIES_BY_ID } from '@/lib/categories'

export function HomePage() {
  const { firebaseUser, profile } = useAuth()
  const locality = useLocalityStore((s) => s.locality)
  const { counts, empty } = useCategoryCounts(locality?.id)

  // `?categoria=` viene de los enlaces que apuntaban a la vieja pantalla de
  // búsqueda; a partir de ahí el filtro se maneja acá.
  const [params] = useSearchParams()
  const [term, setTerm] = useState('')
  const [categoryId, setCategoryId] = useState(() => params.get('categoria') ?? '')

  // Buscar no saca al usuario de la home: mientras haya texto o un rubro
  // elegido, los resultados ocupan el lugar de la grilla de oficios.
  const searching = term.trim().length > 0 || categoryId !== ''
  const { results, loading, error } = useProfessionalSearch({
    term,
    categoryId: categoryId || undefined,
    localityId: locality?.id,
  })

  return (
    <div className="flex flex-col gap-6 p-4">
      <HomeHeader signedIn={Boolean(firebaseUser)} profile={profile} />

      <LocalityPicker />

      <SearchField term={term} onChange={setTerm} />

      {searching ? (
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          locality={locality}
          category={categoryId ? CATEGORIES_BY_ID.get(categoryId) : undefined}
          onClearCategory={() => setCategoryId('')}
        />
      ) : (
        <CategoryGrid counts={counts} empty={empty} onPick={setCategoryId} />
      )}
    </div>
  )
}
