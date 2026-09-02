import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { Professional } from '@/types/models'

export function ProfessionalCard({ professional }: { professional: Professional }) {
  const categories = professional.categoryIds
    .flatMap((id) => CATEGORIES_BY_ID.get(id)?.name ?? [])
    .join(' · ')

  return (
    <Link
      to={`/profesional/${professional.uid}`}
      className="flex gap-3 rounded-2xl border border-slate-200 p-3 transition-colors hover:border-brand-500 dark:border-slate-800"
    >
      {professional.photoURL ? (
        <img
          src={professional.photoURL}
          alt=""
          className="size-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500 dark:bg-slate-800">
          {professional.displayName.charAt(0)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{professional.displayName}</p>
        <p className="truncate text-sm text-slate-500">{categories}</p>
        <p className="mt-1 flex items-center gap-1 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          {professional.ratingCount > 0 ? (
            <>
              <span className="font-medium">{professional.ratingAvg.toFixed(1)}</span>
              <span className="text-slate-500">({professional.ratingCount})</span>
            </>
          ) : (
            <span className="text-slate-500">Sin calificaciones aún</span>
          )}
        </p>
      </div>
    </Link>
  )
}
