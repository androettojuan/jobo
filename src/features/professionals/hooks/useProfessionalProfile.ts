import { useEffect, useState } from 'react'

import { getProfessional, getReviews } from '@/features/professionals/api'
import type { Professional, Review } from '@/types/models'

/** Carga el perfil público y sus reseñas de una sola vez. */
export function useProfessionalProfile(uid: string | undefined) {
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

  return { professional, reviews, setReviews, loading }
}
