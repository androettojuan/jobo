/**
 * Cloud Functions de Jobo.
 *
 * Todo lo que el cliente no puede escribir (agregados, contadores,
 * notificaciones, moderación) vive acá. Ver `firestore.rules`.
 */
export { onReviewWritten } from './reviews.js'
export { onMessageCreated, markChatRead } from './chat.js'
export { onRequestCreated, onRequestUpdated } from './requests.js'
export { onProfessionalWritten, refreshStatsDaily } from './stats.js'
export { onCategoryUpdated, onUserDisabledChanged, onReportCreated } from './moderation.js'
