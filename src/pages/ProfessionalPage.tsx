import { ArrowLeft, BadgeCheck, MapPin, MessageSquare, Phone, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { StarRating } from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import { getProfessional, getReviews } from '@/features/professionals/api'
import { ReportButton } from '@/features/reports/ReportButton'
import { replyToReview } from '@/features/reviews/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import { LOCALITIES_BY_ID } from '@/lib/localities'
import type { Professional, Review } from '@/types/models'

export function ProfessionalPage() {
  const { uid } = useParams<{ uid: string }>()
  const { firebaseUser } = useAuth()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (!uid) return
    let cancelled = false

    Promise.all([getProfessional(uid), getReviews(uid)])
      .then(([prof, revs]) => {
        if (cancelled) return
        setProfessional(prof)
        setReviews(revs)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [uid])

  if (loading) return <Spinner />
  if (!professional) {
    return (
      <EmptyState
        icon={UserX}
        title="Perfil no disponible"
        description="Este profesional no existe o dio de baja su perfil."
      />
    )
  }

  const isOwner = firebaseUser?.uid === professional.uid

  async function sendReply(reviewId: string) {
    await replyToReview(reviewId, replyText)
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? ({ ...r, reply: { text: replyText, createdAt: r.createdAt } } as Review)
          : r,
      ),
    )
    setReplyingTo(null)
    setReplyText('')
  }

  const rate =
    professional.hourlyRateFrom !== null || professional.hourlyRateTo !== null
      ? [professional.hourlyRateFrom, professional.hourlyRateTo]
          .filter((v): v is number => v !== null)
          .map((v) => `$${v.toLocaleString('es-AR')}`)
          .join(' a ')
      : null

  return (
    <div className="flex flex-col gap-6 p-4">
      <Link to="/buscar" className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden /> Volver
      </Link>

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

        <div className="flex items-center gap-2 text-sm">
          <StarRating value={Math.round(professional.ratingAvg)} />
          <span className="text-slate-500">
            {professional.ratingCount > 0
              ? `${professional.ratingAvg.toFixed(1)} · ${professional.ratingCount} ${
                  professional.ratingCount === 1 ? 'reseña' : 'reseñas'
                }`
              : 'Sin calificaciones aún'}
          </span>
        </div>

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
            <span
              key={id}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800"
            >
              {CATEGORIES_BY_ID.get(id)?.name ?? id}
            </span>
          ))}
        </div>
      </header>

      {professional.description && (
        <section>
          <h2 className="mb-1 font-semibold">Sobre mí</h2>
          <p className="text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">
            {professional.description}
          </p>
        </section>
      )}

      {professional.serviceAreaIds.length > 1 && (
        <section>
          <h2 className="mb-1 font-semibold">Zonas donde trabaja</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {professional.serviceAreaIds
              .map((id) => LOCALITIES_BY_ID.get(id)?.name ?? id)
              .join(' · ')}
          </p>
        </section>
      )}

      {professional.photos.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Trabajos</h2>
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4">
            {professional.photos.map((url) => (
              <li key={url}>
                <img src={url} alt="" className="size-32 rounded-xl object-cover" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {firebaseUser ? (
        isOwner ? (
          <Link to="/perfil/profesional">
            <Button variant="secondary" size="lg" className="w-full">
              Editar mi perfil
            </Button>
          </Link>
        ) : (
          <Link to={`/profesional/${professional.uid}/solicitar`}>
            <Button size="lg" className="w-full">
              Pedir presupuesto
            </Button>
          </Link>
        )
      ) : (
        <Link to="/login">
          <Button size="lg" className="w-full">
            Iniciá sesión para contactarlo
          </Button>
        </Link>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Reseñas</h2>
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Todavía no hay reseñas"
            description="Las reseñas aparecen cuando alguien completa un trabajo con este profesional."
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.authorName}</p>
                  <StarRating value={review.rating} />
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>

                {review.reply ? (
                  <p className="mt-2 rounded-xl bg-slate-50 p-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <span className="font-medium">Respuesta: </span>
                    {review.reply.text}
                  </p>
                ) : (
                  isOwner && (
                    <div className="mt-2">
                      {replyingTo === review.id ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            label="Tu respuesta"
                            maxLength={500}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void sendReply(review.id)}>
                              Responder
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(review.id)}>
                          Responder
                        </Button>
                      )}
                    </div>
                  )
                )}

                <div className="mt-2">
                  <ReportButton targetType="review" targetId={review.id} label="Denunciar reseña" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isOwner && (
        <ReportButton
          targetType="professional"
          targetId={professional.uid}
          label="Denunciar este perfil"
        />
      )}
    </div>
  )
}
