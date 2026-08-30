import { Briefcase, ClipboardList, MessageCircle, Pencil, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import { getMyProfessional } from '@/features/professionals/profileApi'
import { REQUEST_STATUS_LABELS, subscribeToRequests } from '@/features/requests/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { JobRequest, Professional } from '@/types/models'

/** Todavía tiene trabajo por delante: no es historial. */
const isOpen = (status: JobRequest['status']) =>
  status === 'pending' || status === 'accepted' || status === 'in_progress'

/** Panel del profesional: sus números y las solicitudes que recibe, por oficio. */
export function ProfessionalDashboardPage() {
  const { firebaseUser } = useAuth()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [requestsFailed, setRequestsFailed] = useState(false)

  useEffect(() => {
    if (!firebaseUser) return
    let cancelled = false
    getMyProfessional(firebaseUser.uid)
      .then((found) => {
        if (!cancelled) setProfessional(found)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [firebaseUser])

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToRequests(firebaseUser.uid, setRequests, () => setRequestsFailed(true))
  }, [firebaseUser])

  // Solo las solicitudes donde soy el profesional: las que yo pedí van en "Solicitudes".
  const received = useMemo(
    () => requests.filter((r) => r.professionalId === firebaseUser?.uid),
    [requests, firebaseUser],
  )

  // Lo que espera respuesta o está en marcha va arriba; el historial, al final.
  const visible = useMemo(() => {
    const list = filter ? received.filter((r) => r.categoryId === filter) : received
    return [...list].sort(
      (a, b) => Number(isOpen(b.status)) - Number(isOpen(a.status)),
    )
  }, [received, filter])

  const pending = received.filter((r) => r.status === 'pending').length
  const active = received.filter((r) => ['accepted', 'in_progress'].includes(r.status)).length

  if (loading) return <Spinner />

  if (!professional) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Briefcase}
          title="Todavía no ofrecés servicios"
          description="Creá tu perfil profesional y empezá a recibir solicitudes de tu zona."
          action={
            <Link to="/perfil/profesional">
              <Button>Crear mi perfil profesional</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Mi trabajo</h1>
          <p className="text-sm text-slate-500">
            {professional.status === 'active'
              ? 'Estás visible en las búsquedas'
              : 'Tu perfil está en pausa: no aparecés en las búsquedas'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link to="/perfil/profesional">
            <Button size="sm" variant="secondary">
              <Pencil className="size-4" aria-hidden />
              Editar
            </Button>
          </Link>
          <NotificationsBell />
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-3">
        {[
          { label: 'Sin responder', value: pending, tone: pending > 0 ? 'text-brand-600' : '' },
          { label: 'En curso', value: active, tone: '' },
          { label: 'Trabajos hechos', value: professional.completedJobs, tone: '' },
          {
            label: 'Calificación',
            value: professional.ratingCount > 0 ? professional.ratingAvg.toFixed(1) : '—',
            tone: '',
            icon: professional.ratingCount > 0,
          },
        ].map((stat) => (
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

      {professional.categoryIds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm',
              filter === ''
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 dark:border-slate-700',
            )}
          >
            Todos los oficios
          </button>
          {professional.categoryIds.map((id) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm',
                filter === id
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 dark:border-slate-700',
              )}
            >
              {CATEGORIES_BY_ID.get(id)?.name ?? id}
            </button>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Solicitudes recibidas</h2>

        {requestsFailed && (
          <p className="text-sm text-red-600">
            No pudimos cargar tus solicitudes. Revisá la conexión y volvé a entrar.
          </p>
        )}

        {requestsFailed ? null : visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={filter ? 'Nada por este oficio' : 'Todavía no te escribieron'}
            description={
              filter
                ? 'Probá sacando el filtro para ver el resto de tus solicitudes.'
                : 'Cuando alguien de tu zona te pida un presupuesto lo vas a ver acá.'
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((request) => (
              <li key={request.id}>
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
                        {request.locality ? ` · ${request.locality.name}` : ''}
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
      </section>

      <Link to="/chats">
        <Button variant="secondary" size="lg" className="w-full">
          <MessageCircle className="size-4" aria-hidden />
          Ver mis mensajes
        </Button>
      </Link>
    </div>
  )
}
