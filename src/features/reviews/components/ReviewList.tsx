import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Textarea'
import { ReportButton } from '@/features/reports/ReportButton'
import type { Review } from '@/types/models'

/** Caja de respuesta del profesional, abierta desde la propia reseña. */
function ReplyForm({ onSend, onCancel }: { onSend: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        label="Tu respuesta"
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSend(text)}>
          Responder
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function ReviewItem({
  review,
  canReply,
  replying,
  onStartReply,
  onCancelReply,
  onSendReply,
}: {
  review: Review
  canReply: boolean
  replying: boolean
  onStartReply: () => void
  onCancelReply: () => void
  onSendReply: (text: string) => void
}) {
  return (
    <li className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <p className="font-medium">{review.authorName}</p>
        <StarRating value={review.rating} />
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>

      {review.reply && (
        <p className="mt-2 rounded-xl bg-slate-50 p-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <span className="font-medium">Respuesta: </span>
          {review.reply.text}
        </p>
      )}

      {!review.reply && canReply && (
        <div className="mt-2">
          {replying ? (
            <ReplyForm onSend={onSendReply} onCancel={onCancelReply} />
          ) : (
            <Button size="sm" variant="ghost" onClick={onStartReply}>
              Responder
            </Button>
          )}
        </div>
      )}

      <div className="mt-2">
        <ReportButton targetType="review" targetId={review.id} label="Denunciar reseña" />
      </div>
    </li>
  )
}

/** Las reseñas de un profesional; si el dueño las mira, puede responderlas. */
export function ReviewList({
  reviews,
  canReply,
  onReply,
}: {
  reviews: Review[]
  canReply: boolean
  onReply: (reviewId: string, text: string) => void
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Todavía no hay reseñas"
        description="Las reseñas aparecen cuando alguien completa un trabajo con este profesional."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          canReply={canReply}
          replying={replyingTo === review.id}
          onStartReply={() => setReplyingTo(review.id)}
          onCancelReply={() => setReplyingTo(null)}
          onSendReply={(text) => {
            onReply(review.id, text)
            setReplyingTo(null)
          }}
        />
      ))}
    </ul>
  )
}
