import { createElement } from 'react'

import { CATEGORIES, CATEGORY_GROUPS, categoryIcon } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/models'

interface CategoryGridProps {
  /** Profesionales activos por rubro en la localidad elegida. */
  counts: Record<string, number>
  /** true cuando todavía no hay nadie cargado: sin números, no atenuamos nada. */
  empty: boolean
  onPick: (categoryId: string) => void
}

function CategoryTile({
  category,
  count,
  empty,
  onPick,
}: {
  category: Category
  count: number
  empty: boolean
  onPick: (categoryId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(category.id)}
      className={cn(
        'flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 p-2 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-slate-900',
        !empty && count === 0 && 'opacity-45',
      )}
    >
      {/* createElement y no `const Icon = ...`: el icono sale de un mapa, no es
          un componente nuevo por render. */}
      {createElement(categoryIcon(category.id), {
        className: 'size-7 text-brand-600',
        'aria-hidden': true,
      })}
      <span className="text-xs leading-tight font-medium">{category.name}</span>
      {!empty && (
        <span className="text-[10px] text-slate-500">
          {count === 0 ? 'sin nadie aún' : count === 1 ? '1 disponible' : `${count} disponibles`}
        </span>
      )}
    </button>
  )
}

/** La grilla de oficios de la home, agrupada y ordenada por disponibilidad. */
export function CategoryGrid({ counts, empty, onPick }: CategoryGridProps) {
  return CATEGORY_GROUPS.map((group) => {
    const categories = CATEGORIES.filter((c) => c.group === group.id)
    if (categories.length === 0) return null

    // Las categorías con profesionales van primero; las vacías quedan
    // visibles pero atenuadas, para que se vea qué falta en el pueblo.
    const sorted = categories.toSorted(
      (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.order - b.order,
    )

    return (
      <section key={group.id}>
        <h2 className="mb-3 text-lg font-semibold">{group.name}</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {sorted.map((item) => (
            <li key={item.id}>
              <CategoryTile
                category={item}
                count={counts[item.id] ?? 0}
                empty={empty}
                onPick={onPick}
              />
            </li>
          ))}
        </ul>
      </section>
    )
  })
}
