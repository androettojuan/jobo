import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'lg'
}

/** Estrellas de 1 a 5. Sin `onChange` es solo lectura. */
export function StarRating({ value, onChange, size = 'sm' }: StarRatingProps) {
  const readOnly = !onChange

  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`${value} de 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        const icon = (
          <Star
            className={cn(
              size === 'lg' ? 'size-9' : 'size-4',
              filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
            )}
            aria-hidden
          />
        )

        return readOnly ? (
          <span key={star}>{icon}</span>
        ) : (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
            onClick={() => onChange(star)}
            className="transition-transform active:scale-90"
          >
            {icon}
          </button>
        )
      })}
    </div>
  )
}
