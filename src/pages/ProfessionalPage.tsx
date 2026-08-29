import { ArrowLeft, MessageSquare, Star, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getProfessional, getReviews } from '@/features/professionals/api'
import { useAuth } from '@/features/auth/useAuth'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { Professional, Review } from '@/types/models'

export function ProfessionalPage() {
  const { uid } = useParams<{ uid: string }>()
  const { firebaseUser } = useAuth()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

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
        <h1 className="text-xl font-bold">{professional.displayName}</h1>
        <p className="text-sm text-slate-500">{professional.headline}</p>
        <p className="flex items-center gap-1 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          {professional.ratingCount > 0
            ? `${professional.ratingAvg.toFixed(1)} · ${professional.ratingCount} reseñas`
            : 'Sin calificaciones aún'}
        </p>
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

      <Button size="lg" disabled={!firebaseUser}>
        {firebaseUser ? 'Solicitar presupuesto' : 'Iniciá sesión para contactarlo'}
      </Button>

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
              <li key={review.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.authorName}</p>
                  <p className="flex items-center gap-0.5 text-sm">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    {review.rating}
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                {review.reply && (
                  <p className="mt-2 rounded-xl bg-slate-50 p-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <span className="font-medium">Respuesta: </span>
                    {review.reply.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
