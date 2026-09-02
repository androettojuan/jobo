import { Link } from 'react-router-dom'

import { REQUEST_STATUS_LABELS } from '@/features/requests/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { JobRequest } from '@/types/models'

/** Fila de solicitud: la misma en "Solicitudes" y en el panel del profesional. */
export function RequestCard({ request, aside }: { request: JobRequest; aside?: string }) {
  return (
    <Link
      to={`/solicitudes/${request.id}`}
      className={cn(
        'block rounded-2xl border p-3',
        request.status === 'pending'
          ? 'border-brand-500 bg-brand-50/50 dark:bg-slate-900'
          : 'border-slate-200 dark:border-slate-800',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{request.title}</p>
          <p className="text-sm text-slate-500">
            {CATEGORIES_BY_ID.get(request.categoryId)?.name ?? request.categoryId}
            {aside ? ` · ${aside}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
      </div>
    </Link>
  )
}
