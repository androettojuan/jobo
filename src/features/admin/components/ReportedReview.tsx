import { EyeOff, Eye, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { getReportedReview, setReviewHidden } from '@/features/admin/api'
import type { Review } from '@/types/models'

/**
 * La reseña denunciada, con el botón para sacarla de la vista.
 *
 * Antes el panel mostraba solo el motivo de la denuncia: había que decidir sin
 * poder leer lo denunciado, y la única acción posible era cerrar el caso.
 *
 * Ocultar no borra: la saca de la ficha del profesional y del cálculo del
 * promedio, y se puede deshacer si la denuncia era infundada.
 */
export function ReportedReview({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<Review | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    getReportedReview(reviewId)
      .then((encontrada) => {
        if (!cancelado) setReview(encontrada)
      })
      .catch(() => {
        if (!cancelado) setError('No pudimos leer la reseña.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [reviewId])

  if (cargando) return <p className="text-xs text-slate-500">Buscando la reseña…</p>

  // El autor puede borrar la suya: si ya no está, no hay nada que moderar.
  if (!review) {
    return <p className="text-xs text-slate-500">La reseña ya no existe.</p>
  }

  async function alternar() {
    if (!review) return
    setError('')
    setGuardando(true)
    try {
      await setReviewHidden(review.id, !review.hidden)
      setReview({ ...review, hidden: !review.hidden })
    } catch {
      setError('No pudimos cambiarlo. Probá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-0.5 font-medium text-slate-700 dark:text-slate-300">
          {review.rating}
          <Star className="size-3 fill-current" aria-hidden />
        </span>
        <span className="truncate">{review.authorName}</span>
        {review.hidden && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            oculta
          </span>
        )}
      </div>

      {review.comment ? (
        <p className="text-sm">{review.comment}</p>
      ) : (
        <p className="text-sm text-slate-500">Sin texto: solo la calificación.</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        size="sm"
        variant={review.hidden ? 'secondary' : 'danger'}
        loading={guardando}
        onClick={() => void alternar()}
        className="self-start"
      >
        {review.hidden ? (
          <>
            <Eye className="size-4" aria-hidden />
            Volver a mostrarla
          </>
        ) : (
          <>
            <EyeOff className="size-4" aria-hidden />
            Ocultar la reseña
          </>
        )}
      </Button>
    </div>
  )
}
