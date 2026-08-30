import { Search, SearchX, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { LocalityPicker } from '@/features/localities/LocalityPicker'
import { useLocalityStore } from '@/features/localities/store'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import { ProfessionalCard } from '@/features/professionals/components/ProfessionalCard'
import { useCategoryCounts } from '@/features/professionals/useCategoryCounts'
import { useProfessionalSearch } from '@/features/professionals/useProfessionalSearch'
import { CATEGORIES, CATEGORIES_BY_ID, CATEGORY_GROUPS, categoryIcon } from '@/lib/categories'
import { cn } from '@/lib/utils'

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
  const category = categoryId ? CATEGORIES_BY_ID.get(categoryId) : undefined

  return (
    <div className="flex flex-col gap-6 p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            {profile ? `Hola, ${profile.displayName.split(' ')[0]}` : 'Bienvenido a'}
          </p>
          <h1>
            <img src="/img/jobo-logo.png" alt="Jobo" className="h-8 w-auto" />
          </h1>
        </div>
        {firebaseUser ? (
          <NotificationsBell className="shrink-0" />
        ) : (
          <Link to="/login" className="shrink-0 text-sm font-medium text-brand-600 hover:underline">
            Iniciar sesión
          </Link>
        )}
      </header>

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
          className="h-12 w-full rounded-xl border border-slate-300 pr-11 pl-11 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 [&::-webkit-search-cancel-button]:hidden"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm('')}
            aria-label="Limpiar la búsqueda"
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {searching ? (
        <section>
          {category && (
            <button
              type="button"
              onClick={() => setCategoryId('')}
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm text-white"
            >
              {category.name}
              <X className="size-4" aria-hidden />
              <span className="sr-only">Quitar el filtro de rubro</span>
            </button>
          )}

          {loading && <Spinner />}
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
      ) : (
        CATEGORY_GROUPS.map((group) => {
          const categories = CATEGORIES.filter((c) => c.group === group.id)
          if (categories.length === 0) return null

          // Las categorías con profesionales van primero; las vacías quedan
          // visibles pero atenuadas, para que se vea qué falta en el pueblo.
          const sorted = [...categories].sort(
            (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.order - b.order,
          )

          return (
            <section key={group.id}>
              <h2 className="mb-3 text-lg font-semibold">{group.name}</h2>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {sorted.map((item) => {
                  const Icon = categoryIcon(item.id)
                  const count = counts[item.id] ?? 0
                  const dim = !empty && count === 0

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setCategoryId(item.id)}
                        className={cn(
                          'flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 p-2 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-slate-900',
                          dim && 'opacity-45',
                        )}
                      >
                        <Icon className="size-7 text-brand-600" aria-hidden />
                        <span className="text-xs leading-tight font-medium">{item.name}</span>
                        {!empty && (
                          <span className="text-[10px] text-slate-500">
                            {count === 0
                              ? 'sin nadie aún'
                              : count === 1
                                ? '1 disponible'
                                : `${count} disponibles`}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
