import { Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { LocalityPicker } from '@/features/localities/LocalityPicker'
import { useLocalityStore } from '@/features/localities/store'
import { useCategoryCounts } from '@/features/professionals/useCategoryCounts'
import { CATEGORIES, CATEGORY_GROUPS, categoryIcon } from '@/lib/categories'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const locality = useLocalityStore((s) => s.locality)
  const { counts, empty } = useCategoryCounts(locality?.id)

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

      <button
        onClick={() => navigate('/buscar')}
        className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-300 px-4 text-left text-slate-500 dark:border-slate-700"
      >
        <Search className="size-5" aria-hidden />
        ¿Qué necesitás resolver?
      </button>

      {CATEGORY_GROUPS.map((group) => {
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
      })}
    </div>
  )
}
