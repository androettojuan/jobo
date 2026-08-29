import { Search, SearchX, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { LocalityPicker } from '@/features/localities/LocalityPicker'
import { useLocalityStore } from '@/features/localities/store'
import { ProfessionalCard } from '@/features/professionals/components/ProfessionalCard'
import { useCategoryCounts } from '@/features/professionals/useCategoryCounts'
import { useProfessionalSearch } from '@/features/professionals/useProfessionalSearch'
import { CATEGORIES, CATEGORY_GROUPS, categoryIcon } from '@/lib/categories'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { profile } = useAuth()
  const locality = useLocalityStore((s) => s.locality)
  const { counts, empty } = useCategoryCounts(locality?.id)
  const [term, setTerm] = useState('')

  // Mientras se escribe, los resultados ocupan el lugar de los rubros: buscar
  // no saca al usuario de la home.
  const searching = term.trim().length > 0
  const { results, loading, error } = useProfessionalSearch(term, locality?.id)

  return (
    <div className="flex flex-col gap-6 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            {profile ? `Hola, ${profile.displayName.split(' ')[0]}` : 'Bienvenido a'}
          </p>
          <h1>
            <img src="/img/jobo-logo.png" alt="Jobo" className="h-8 w-auto" />
          </h1>
        </div>
        {!profile && (
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
        {searching && (
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
          {loading && <Spinner />}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              description={
                locality
                  ? `Nadie coincide con “${term.trim()}” en ${locality.name}. Probá con otras palabras o cambiá de localidad.`
                  : `Nadie coincide con “${term.trim()}”. Probá con otras palabras.`
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
              <Link
                to={`/buscar?q=${encodeURIComponent(term.trim())}`}
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Filtrar por rubro
              </Link>
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
                {sorted.map((category) => {
                  const Icon = categoryIcon(category.id)
                  const count = counts[category.id] ?? 0
                  const dim = !empty && count === 0

                  return (
                    <li key={category.id}>
                      <Link
                        to={`/buscar?categoria=${category.id}`}
                        className={cn(
                          'flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 p-2 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-slate-900',
                          dim && 'opacity-45',
                        )}
                      >
                        <Icon className="size-7 text-brand-600" aria-hidden />
                        <span className="text-xs leading-tight font-medium">{category.name}</span>
                        {!empty && (
                          <span className="text-[10px] text-slate-500">
                            {count === 0
                              ? 'sin nadie aún'
                              : count === 1
                                ? '1 disponible'
                                : `${count} disponibles`}
                          </span>
                        )}
                      </Link>
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
