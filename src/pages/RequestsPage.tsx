import { ClipboardList } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { CardListSkeleton } from '@/components/ui/skeletons'
import { useAuth } from '@/features/auth/useAuth'
import { subscribeToRequests } from '@/features/requests/api'
import { RequestCard } from '@/features/requests/components/RequestCard'
import { cn } from '@/lib/utils'
import type { JobRequest, RequestStatus } from '@/types/models'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'

/** Lo que todavía tiene trabajo por delante; el resto es historial. */
const OPEN_STATUSES = new Set<RequestStatus>(['pending', 'accepted', 'in_progress'])

const openCount = (list: JobRequest[]) => list.filter((r) => OPEN_STATUSES.has(r.status)).length

function RequestList({
  requests,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  requests: JobRequest[]
  emptyTitle: string
  emptyDescription: string
  emptyAction?: React.ReactNode
}) {
  const open = requests.filter((r) => OPEN_STATUSES.has(r.status))
  const closed = requests.filter((r) => !OPEN_STATUSES.has(r.status))

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {open.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {open.map((request) => (
            <li key={request.id}>
              <RequestCard request={request} aside={request.locality?.name} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No te queda nada abierto por acá.</p>
      )}

      {closed.length > 0 && (
        <details className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <summary className="cursor-pointer text-sm font-medium text-slate-500">
            Cerradas ({closed.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {closed.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} aside={request.locality?.name} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export function RequestsPage() {
  const { firebaseUser, profile } = useAuth()
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'mine' | 'received'>('mine')

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToRequests(
      firebaseUser.uid,
      (list) => {
        setRequests(list)
        setError('')
        setLoading(false)
      },
      () => {
        setError('No pudimos cargar tus solicitudes. Revisá la conexión y volvé a entrar.')
        setLoading(false)
      },
    )
  }, [firebaseUser])

  const { mine, received } = useMemo(
    () => ({
      mine: requests.filter((r) => r.clientId === firebaseUser?.uid),
      received: requests.filter((r) => r.professionalId === firebaseUser?.uid),
    }),
    [requests, firebaseUser],
  )

  // Al vecino que no ofrece servicios no le mostramos una pestaña que siempre
  // va a estar vacía.
  const showReceived = profile?.isProfessional || received.length > 0
  if (loading) return <CardListSkeleton />

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Solicitudes</h1>
        <NotificationsBell />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && showReceived && (
        <div className="flex gap-2">
          {(
            [
              { id: 'mine', label: 'Pedí', count: openCount(mine) },
              { id: 'received', label: 'Me pidieron', count: openCount(received) },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                tab === item.id
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 dark:border-slate-700',
              )}
            >
              {item.label}
              {item.count > 0 && (
                <span
                  className={cn(
                    'grid min-w-5 place-items-center rounded-full px-1 text-xs',
                    tab === item.id ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {error ? null : tab === 'mine' || !showReceived ? (
        <RequestList
          requests={mine}
          emptyTitle="Todavía no contactaste a nadie"
          emptyDescription="Buscá un profesional y contactalo: la consulta va a aparecer acá."
          emptyAction={
            <Link to="/" className="font-medium text-brand-600 hover:underline">
              Buscar profesionales
            </Link>
          }
        />
      ) : (
        <RequestList
          requests={received}
          emptyTitle="Todavía no te pidieron nada"
          emptyDescription="Cuando alguien de tu zona te contacte lo vas a ver acá."
        />
      )}
    </div>
  )
}
