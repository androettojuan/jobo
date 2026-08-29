import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { StarRating } from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import { subscribeToRequest } from '@/features/requests/createApi'
import { getReviewForRequest, submitReview } from '@/features/reviews/api'
import type { JobRequest } from '@/types/models'

export function ReviewPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [request, setRequest] = useState<JobRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!requestId) return
    return subscribeToRequest(requestId, (found) => {
      setRequest(found)
      setLoading(false)
    })
  }, [requestId])

  useEffect(() => {
    if (!requestId) return
    let cancelled = false
    getReviewForRequest(requestId).then((existing) => {
      if (cancelled || !existing) return
      setAlreadyReviewed(true)
      setRating(existing.rating)
      setComment(existing.comment)
    })
    return () => {
      cancelled = true
    }
  }, [requestId])

  if (loading) return <Spinner />
  if (!request || !profile) {
    return <p className="p-6 text-center text-slate-500">No encontramos esta solicitud.</p>
  }
  if (request.status !== 'completed') {
    return (
      <p className="p-6 text-center text-slate-500">
        Vas a poder calificar cuando el trabajo esté marcado como completado.
      </p>
    )
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!request || !profile) return

    setError('')
    setSaving(true)
    try {
      await submitReview({
        requestId: request.id,
        professionalId: request.professionalId,
        author: profile,
        rating,
        comment,
      })
      navigate(`/profesional/${request.professionalId}`, { replace: true })
    } catch {
      setError('No pudimos guardar tu calificación. Probá de nuevo.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 p-4">
      <Link
        to={`/solicitudes/${request.id}`}
        className="flex items-center gap-1 text-sm text-slate-500"
      >
        <ArrowLeft className="size-4" aria-hidden /> Volver a la solicitud
      </Link>

      <header>
        <h1 className="text-2xl font-bold">
          {alreadyReviewed ? 'Editar tu calificación' : 'Calificar el trabajo'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{request.title}</p>
      </header>

      <div className="flex flex-col items-center gap-2">
        <StarRating value={rating} onChange={setRating} size="lg" />
        <p className="text-sm text-slate-500">
          {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
        </p>
      </div>

      <Textarea
        label="¿Cómo fue tu experiencia?"
        placeholder="Llegó puntual, dejó todo limpio y el precio fue el acordado."
        maxLength={800}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        hint="Tu reseña es pública y va a ayudar a otros vecinos."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" size="lg" loading={saving}>
        {alreadyReviewed ? 'Guardar cambios' : 'Publicar calificación'}
      </Button>
    </form>
  )
}
