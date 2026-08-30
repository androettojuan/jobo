import type { JobRequest, RequestStatus } from '@/types/models'

export const ME = 'yo-1'
export const OTHER = 'otro-1'

/** Solicitud de prueba; se le pisa lo que cada caso necesite. */
export function jobRequest(overrides: Partial<JobRequest> & { id: string }): JobRequest {
  const status: RequestStatus = overrides.status ?? 'pending'
  return {
    clientId: ME,
    professionalId: OTHER,
    participantIds: [ME, OTHER],
    categoryId: 'plomero',
    title: 'Pierde la canilla',
    description: 'Gotea hace una semana',
    photos: [],
    locality: { id: 'villa-rumipal', name: 'Villa Rumipal', province: 'Córdoba' },
    preferredAt: null,
    chatId: 'chat-1',
    ...overrides,
    status,
  } as JobRequest
}
