import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Professional } from '@/types/models'

/** Los cuatro números del panel: sin responder, en curso, hechos y calificación. */
export function DashboardStats({
  professional,
  pending,
  active,
}: {
  professional: Professional
  pending: number
  active: number
}) {
  const stats = [
    { label: 'Sin responder', value: pending, tone: pending > 0 ? 'text-brand-600' : '' },
    { label: 'En curso', value: active, tone: '' },
    { label: 'Trabajos hechos', value: professional.completedJobs, tone: '' },
    {
      label: 'Calificación',
      value: professional.ratingCount > 0 ? professional.ratingAvg.toFixed(1) : '—',
      tone: '',
      icon: professional.ratingCount > 0,
    },
  ]

  return (
    <ul className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <li
          key={stat.label}
          className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
        >
          <p className={cn('flex items-center gap-1 text-2xl font-bold', stat.tone)}>
            {stat.value}
            {stat.icon && <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />}
          </p>
          <p className="text-xs text-slate-500">{stat.label}</p>
        </li>
      ))}
    </ul>
  )
}
