import { ArrowLeft, UserX } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { ProfileSkeleton } from '@/components/ui/skeletons'
import { useAuth } from '@/features/auth/useAuth'
import { ProfessionalHeader } from '@/features/professionals/components/ProfessionalHeader'
import { useProfessionalProfile } from '@/features/professionals/hooks/useProfessionalProfile'
import { ReportButton } from '@/features/reports/ReportButton'
import { replyToReview } from '@/features/reviews/api'
import { ReviewList } from '@/features/reviews/components/ReviewList'
import { LOCALITIES_BY_ID } from '@/lib/localities'
import type { Review } from '@/types/models'

/** El botón grande de abajo: contactar, editar el propio perfil o entrar. */
function ContactAction({
  uid,
  signedIn,
  isOwner,
}: {
  uid: string
  signedIn: boolean
  isOwner: boolean
}) {
  if (!signedIn) {
    return (
      <Link to="/login">
        <Button size="lg" className="w-full">
          Iniciá sesión para contactarlo
        </Button>
      </Link>
    )
  }

  if (isOwner) {
    return (
      <Link to="/perfil/profesional">
        <Button variant="secondary" size="lg" className="w-full">
          Editar mi perfil
        </Button>
      </Link>
    )
  }

  return (
    <Link to={`/profesional/${uid}/solicitar`}>
      <Button size="lg" className="w-full">
        Contactar
      </Button>
    </Link>
  )
}

export function ProfessionalPage() {
  const { uid } = useParams<{ uid: string }>()
  const { firebaseUser } = useAuth()
  const { professional, reviews, setReviews, loading } = useProfessionalProfile(uid)

  if (loading) return <ProfileSkeleton />
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

  async function sendReply(reviewId: string, text: string) {
    await replyToReview(reviewId, text)
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? ({ ...r, reply: { text, createdAt: r.createdAt } } as Review) : r,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <Link to="/" className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden /> Volver
      </Link>

      <ProfessionalHeader professional={professional} />

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
          <ul className="grid grid-cols-3 gap-2">
            {professional.photos.map((url) => (
              <li key={url}>
                <img src={url} alt="" className="aspect-square w-full rounded-xl object-cover" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ContactAction uid={professional.uid} signedIn={Boolean(firebaseUser)} isOwner={isOwner} />

      <section>
        <h2 className="mb-3 font-semibold">Reseñas</h2>
        <ReviewList
          reviews={reviews}
          canReply={isOwner}
          onReply={(reviewId, text) => void sendReply(reviewId, text)}
        />
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
