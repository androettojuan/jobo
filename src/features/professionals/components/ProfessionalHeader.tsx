import { BadgeCheck, MapPin, Phone } from 'lucide-react'

import { StarRating } from '@/components/ui/StarRating'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { Professional } from '@/types/models'

/** "$8.000 a $12.000", o solo una de las dos puntas, o null si no cargó precio. */
function formatRate({ hourlyRateFrom, hourlyRateTo }: Professional) {
  const parts = [hourlyRateFrom, hourlyRateTo]
    .filter((v): v is number => v !== null)
    .map((v) => `$${v.toLocaleString('es-AR')}`)

  return parts.length > 0 ? parts.join(' a ') : null
}

function Rating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StarRating value={Math.round(avg)} />
      <span className="text-slate-500">
        {count > 0
          ? `${avg.toFixed(1)} · ${count} ${count === 1 ? 'reseña' : 'reseñas'}`
          : 'Sin calificaciones aún'}
      </span>
    </div>
  )
}

/** Foto, nombre, calificación, localidad, precio y oficios. */
export function ProfessionalHeader({ professional }: { professional: Professional }) {
  const rate = formatRate(professional)

  return (
    <header className="flex flex-col items-center gap-2 text-center">
      {professional.photoURL ? (
        <img src={professional.photoURL} alt="" className="size-24 rounded-full object-cover" />
      ) : (
        <div className="grid size-24 place-items-center rounded-full bg-slate-100 text-3xl font-semibold text-slate-500 dark:bg-slate-800">
          {professional.displayName.charAt(0)}
        </div>
      )}

      <h1 className="flex items-center gap-1.5 text-xl font-bold">
        {professional.displayName}
        {professional.verified && (
          <BadgeCheck className="size-5 text-brand-600" aria-label="Perfil verificado" />
        )}
      </h1>

      {professional.headline && <p className="text-sm text-slate-500">{professional.headline}</p>}

      <Rating avg={professional.ratingAvg} count={professional.ratingCount} />

      {professional.locality && (
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="size-4" aria-hidden />
          {professional.locality.name}
        </p>
      )}

      {rate && <p className="text-sm text-slate-500">{rate} por hora</p>}

      {professional.publicPhone && (
        <a
          href={`tel:${professional.publicPhone}`}
          className="flex items-center gap-1 text-sm font-medium text-brand-600"
        >
          <Phone className="size-4" aria-hidden />
          {professional.publicPhone}
        </a>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {professional.categoryIds.map((id) => (
          <span key={id} className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
            {CATEGORIES_BY_ID.get(id)?.name ?? id}
          </span>
        ))}
      </div>
    </header>
  )
}
