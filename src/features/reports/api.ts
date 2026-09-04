import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import type { ReportReason, ReportTargetType } from '@/types/models'

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'fraud', label: 'Me quiso estafar' },
  { value: 'abuse', label: 'Me trató mal' },
  { value: 'fake_profile', label: 'El perfil es falso' },
  { value: 'no_show', label: 'No se presentó' },
  { value: 'spam', label: 'Manda spam' },
  { value: 'other', label: 'Otro motivo' },
]

export async function createReport({
  chatId,
  ...params
}: {
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  /** Obligatorio al denunciar un mensaje: es lo que permite encontrarlo. */
  chatId?: string
  reason: ReportReason
  details: string
}) {
  await addDoc(collection(db, 'reports'), {
    ...params,
    // Firestore rechaza `undefined`, y las denuncias que no son de un mensaje
    // no llevan chat: se manda el campo solo cuando existe.
    ...(chatId ? { chatId } : {}),
    details: params.details.trim(),
    status: 'open',
    resolution: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: serverTimestamp(),
  })
}
