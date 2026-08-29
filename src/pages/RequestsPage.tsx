import { ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { REQUEST_STATUS_LABELS, subscribeToRequests } from '@/features/requests/api'
import { useAuth } from '@/features/auth/useAuth'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { JobRequest } from '@/types/models'

export function RequestsPage() {
  const { firebaseUser } = useAuth()
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToRequests(firebaseUser.uid, (list) => {
      setRequests(list)
      setLoading(false)
    })
  }, [firebaseUser])

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Solicitudes</h1>

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tenés solicitudes"
          description="Buscá un profesional y pedile un presupuesto: la solicitud va a aparecer acá."
          action={
            <Link to="/buscar" className="font-medium text-brand-600 hover:underline">
              Buscar profesionales
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.id}>
              <Link
                to={`/solicitudes/${request.id}`}
                className="block rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{request.title}</p>
                    <p className="text-sm text-slate-500">
                      {CATEGORIES_BY_ID.get(request.categoryId)?.name ?? request.categoryId}
                      {request.clientId === firebaseUser?.uid
                        ? ' · la pediste vos'
                        : ' · te la pidieron'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                    {REQUEST_STATUS_LABELS[request.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
