import { Briefcase, MessageCircle, Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { DashboardSkeleton } from '@/components/ui/skeletons'
import { useAuth } from '@/features/auth/useAuth'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import { CategoryFilter } from '@/features/professionals/components/CategoryFilter'
import { DashboardStats } from '@/features/professionals/components/DashboardStats'
import { ReceivedRequests } from '@/features/professionals/components/ReceivedRequests'
import { getMyProfessional } from '@/features/professionals/profileApi'
import { subscribeToRequests } from '@/features/requests/api'
import type { JobRequest, Professional } from '@/types/models'

/** Todavía tiene trabajo por delante: no es historial. */
const isOpen = (status: JobRequest['status']) =>
  status === 'pending' || status === 'accepted' || status === 'in_progress'

const ACTIVE_STATUSES = new Set<JobRequest['status']>(['accepted', 'in_progress'])

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
    return list.toSorted((a, b) => Number(isOpen(b.status)) - Number(isOpen(a.status)))
  }, [received, filter])

  const pending = received.filter((r) => r.status === 'pending').length
  const active = received.filter((r) => ACTIVE_STATUSES.has(r.status)).length

  if (loading) return <DashboardSkeleton />

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

      <DashboardStats professional={professional} pending={pending} active={active} />

      <CategoryFilter categoryIds={professional.categoryIds} value={filter} onChange={setFilter} />

      <ReceivedRequests requests={visible} filtered={filter !== ''} failed={requestsFailed} />

      <Link to="/chats">
        <Button variant="secondary" size="lg" className="w-full">
          <MessageCircle className="size-4" aria-hidden />
          Ver mis mensajes
        </Button>
      </Link>
    </div>
  )
}
