import { CATEGORIES_BY_ID } from '@/lib/categories'
import { cn } from '@/lib/utils'

const chip = (active: boolean) =>
  cn(
    'shrink-0 rounded-full border px-3 py-1.5 text-sm',
    active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700',
  )

/** Filtro por oficio; solo tiene sentido si el profesional ofrece más de uno. */
export function CategoryFilter({
  categoryIds,
  value,
  onChange,
}: {
  categoryIds: string[]
  /** '' = todos los oficios. */
  value: string
  onChange: (categoryId: string) => void
}) {
  if (categoryIds.length <= 1) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onChange('')} className={chip(value === '')}>
        Todos los oficios
      </button>
      {categoryIds.map((id) => (
        <button key={id} onClick={() => onChange(id)} className={chip(value === id)}>
          {CATEGORIES_BY_ID.get(id)?.name ?? id}
        </button>
      ))}
    </div>
  )
}
