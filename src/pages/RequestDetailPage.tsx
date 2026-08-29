import { ArrowLeft, MessageCircle, Phone, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import {
  allowedTransitions,
  getCounterpartPhone,
  subscribeToRequest,
  updateRequestStatus,
} from '@/features/requests/createApi'
import { REQUEST_STATUS_LABELS } from '@/features/requests/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { JobRequest, RequestStatus } from '@/types/models'

const ACTION_LABELS: Record<RequestStatus, string> = {
  pending: 'Volver a pendiente',
  accepted: 'Aceptar',
  rejected: 'Rechazar',
  in_progress: 'Marcar en curso',
  completed: 'Marcar como completado',
  cancelled: 'Cancelar',
}

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const { firebaseUser } = useAuth()
  const [request, setRequest] = useState<JobRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!requestId) return
    return subscribeToRequest(requestId, (found) => {
      setRequest(found)
      setLoading(false)
    })
  }, [requestId])

  useEffect(() => {
    if (!request || !firebaseUser) return
    let cancelled = false
    getCounterpartPhone(request, firebaseUser.uid).then((value) => {
      if (!cancelled) setPhone(value)
    })
    return () => {
      cancelled = true
    }
  }, [request, firebaseUser])

  if (loading) return <Spinner />
  if (!request || !firebaseUser) {
    return <p className="p-6 text-center text-slate-500">No encontramos esta solicitud.</p>
  }

  const isClient = request.clientId === firebaseUser.uid
  const transitions = allowedTransitions(request, firebaseUser.uid)

  async function act(status: RequestStatus) {
    if (!request || !firebaseUser) return
    setError('')
    setWorking(true)
    try {
      await updateRequestStatus(request, firebaseUser.uid, status)
    } catch {
      setError('No pudimos actualizar la solicitud.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <Link to="/solicitudes" className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden /> Solicitudes
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{request.title}</h1>
          <p className="text-sm text-slate-500">
            {CATEGORIES_BY_ID.get(request.categoryId)?.name ?? request.categoryId}
            {request.locality ? ` · ${request.locality.name}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
      </header>

      <p className="text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">
        {request.description}
      </p>

      {request.preferredAt && (
        <p className="text-sm text-slate-500">
          Preferencia de fecha: {request.preferredAt.toDate().toLocaleString('es-AR')}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {request.chatId && (
          <Link to={`/chats/${request.chatId}`}>
            <Button variant="secondary" size="lg" className="w-full">
              <MessageCircle className="size-4" aria-hidden />
              Abrir chat
            </Button>
          </Link>
        )}

        {phone ? (
          <a href={`tel:${phone}`}>
            <Button variant="secondary" size="lg" className="w-full">
              <Phone className="size-4" aria-hidden />
              Llamar a {phone}
            </Button>
          </a>
        ) : (
          <p className="text-xs text-slate-500">
            {['accepted', 'in_progress', 'completed'].includes(request.status)
              ? 'La otra persona todavía no cargó su teléfono. Podés coordinar por chat.'
              : 'El teléfono se comparte cuando el profesional acepta la solicitud.'}
          </p>
        )}

        {request.status === 'completed' && isClient && (
          <Link to={`/solicitudes/${request.id}/resena`}>
            <Button size="lg" className="w-full">
              <Star className="size-4" aria-hidden />
              Calificar el trabajo
            </Button>
          </Link>
        )}
      </div>

      {transitions.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-sm font-medium">Acciones</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'cancelled' || status === 'rejected' ? 'danger' : 'primary'}
                loading={working}
                onClick={() => void act(status)}
              >
                {ACTION_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
