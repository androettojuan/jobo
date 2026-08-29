import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { Review, User } from '@/types/models'

/** Una reseña por solicitud: el id del documento es el id de la solicitud. */
export async function getReviewForRequest(requestId: string) {
  const snap = await getDoc(doc(db, 'reviews', requestId))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Review) : null
}

export async function submitReview(params: {
  requestId: string
  professionalId: string
  author: User
  rating: number
  comment: string
}) {
  await setDoc(doc(db, 'reviews', params.requestId), {
    requestId: params.requestId,
    professionalId: params.professionalId,
    authorId: params.author.uid,
    authorName: params.author.displayName,
    authorPhotoURL: params.author.photoURL,
    rating: params.rating,
    comment: params.comment.trim(),
    reply: null,
    hidden: false,
    createdAt: serverTimestamp(),
  })
}

/** Derecho a réplica del profesional sobre una reseña recibida. */
export async function replyToReview(reviewId: string, text: string) {
  await updateDoc(doc(db, 'reviews', reviewId), {
    reply: { text: text.trim(), createdAt: serverTimestamp() },
  })
}
