import type { Timestamp } from 'firebase/firestore'

/**
 * Modelo de datos de Jobo (Firestore).
 *
 * Convención: los documentos usan el `uid` de Firebase Auth como id cuando
 * pertenecen a un usuario (`users/{uid}`, `professionals/{uid}`).
 */

export type Id = string

/**
 * Localidad (pueblo o ciudad). La app trabaja a nivel de localidad y NO guarda
 * la ubicación precisa de nadie: alcanza para "quién trabaja en mi pueblo" y
 * evita exponer domicilios.
 */
export interface Locality {
  /** Slug estable, p.ej. "villa-rumipal". */
  id: Id
  name: string
  province: string
  /** Centro aproximado, solo para ordenar por cercanía y detectar la localidad. */
  lat: number
  lng: number
}

/** Referencia embebida a una localidad dentro de otros documentos. */
export interface LocalityRef {
  id: Id
  name: string
  province: string
}

/* -------------------------------------------------------------------------- */
/* users/{uid}                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Token de push de un dispositivo, con la plataforma que lo emitió.
 *
 * El aviso que hay que armar del otro lado no es el mismo en las tres: la web
 * necesita bloque `webpush`, Android no muestra nada si el mensaje llega solo
 * con `data`, y iOS no recibe nada sin bloque `apns`.
 */
export interface FcmToken {
  token: string
  platform: string
}

/** Perfil base: lo tiene TODO usuario, contrate o preste servicios. */
export interface User {
  uid: Id
  displayName: string
  email: string
  phone: string | null
  /** El teléfono solo se muestra a quien tiene una solicitud aceptada. */
  phoneIsPublic: boolean
  photoURL: string | null
  /** Localidad donde vive/necesita el servicio. */
  locality: LocalityRef | null
  /** true cuando el usuario activó su perfil profesional. */
  isProfessional: boolean
  /** Tokens de FCM por dispositivo, para push notifications. */
  fcmTokens: FcmToken[]
  /** Bloqueo administrativo. */
  disabled: boolean
  /** Cuándo aceptó los términos. Las cuentas viejas no lo tienen. */
  acceptedTermsAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* professionals/{uid}                                                        */
/* -------------------------------------------------------------------------- */

export type ProfessionalStatus = 'draft' | 'active' | 'paused'

/** Perfil profesional. Documento separado: se lee mucho y se filtra mucho. */
export interface Professional {
  uid: Id
  /** Desnormalizado desde users/{uid} para listar sin N lecturas extra. */
  displayName: string
  photoURL: string | null
  /** Slugs de `categories`. Hasta 5: un profesional puede tener varios oficios. */
  categoryIds: Id[]
  headline: string
  description: string
  /** Localidad base del profesional. */
  locality: LocalityRef | null
  /**
   * Localidades donde presta servicio, incluida la propia. Es lo que se
   * consulta con `array-contains` al buscar "plomeros en mi pueblo".
   */
  serviceAreaIds: Id[]
  /** Rango orientativo por hora, en ARS. null = "a convenir". */
  hourlyRateFrom: number | null
  hourlyRateTo: number | null
  photos: string[]
  /**
   * Teléfono visible para cualquiera, solo si el usuario marcó
   * `phoneIsPublic`. Lo sincroniza una Cloud Function desde `users/{uid}`:
   * la ficha es pública y no puede leer el documento del usuario.
   */
  publicPhone: string | null
  status: ProfessionalStatus
  /** Verificación manual de identidad/matrícula. */
  verified: boolean
  /* Agregados mantenidos por Cloud Functions, nunca por el cliente. */
  ratingAvg: number
  ratingCount: number
  completedJobs: number
  /** Para ordenar por "responde rápido". Milisegundos promedio. */
  avgResponseMs: number | null
  /** Denominador de `avgResponseMs`. Lo mantiene la Cloud Function. */
  answeredRequests?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* categories/{slug}                                                          */
/* -------------------------------------------------------------------------- */

export type CategoryStatus = 'active' | 'pending' | 'rejected'

export interface Category {
  /** Slug. Para las propuestas por usuarios se genera del nombre. */
  id: Id
  name: string
  /** Nombre de icono de lucide; las propuestas arrancan con uno genérico. */
  icon: string
  order: number
  active: boolean
  /**
   * Las categorías del catálogo base son 'active'. Si alguien ofrece un oficio
   * que no está en la lista, se crea una 'pending' que el admin aprueba,
   * renombra (para evitar "Plomeria" vs "Plomero") o rechaza.
   */
  status?: CategoryStatus
  /** uid de quien la propuso, si no es del catálogo base. */
  proposedBy?: Id | null
  /** Cuando el admin la unifica con otra existente, apunta al slug bueno. */
  mergedInto?: Id | null
}

/* -------------------------------------------------------------------------- */
/* requests/{id}                                                              */
/* -------------------------------------------------------------------------- */

export type RequestStatus =
  'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Solicitud de trabajo. Es el hilo conductor de la app: habilita el chat,
 * el intercambio de teléfono y, al completarse, la reseña.
 */
export interface JobRequest {
  id: Id
  clientId: Id
  professionalId: Id
  /** [clientId, professionalId] — permite un solo índice para ambos lados. */
  participantIds: [Id, Id]
  categoryId: Id
  title: string
  description: string
  photos: string[]
  locality: LocalityRef | null
  status: RequestStatus
  /** Fecha/hora propuesta por el cliente. */
  preferredAt: Timestamp | null
  chatId: Id | null
  /** Se setea al pasar a `completed`; habilita reseñar. */
  completedAt: Timestamp | null
  /** Quién canceló, para mostrarlo en el historial. */
  cancelledBy: Id | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* chats/{id} + chats/{id}/messages/{id}                                      */
/* -------------------------------------------------------------------------- */

export interface Chat {
  id: Id
  participantIds: Id[]
  /** Datos mínimos de cada participante para pintar la lista sin joins. */
  participants: Record<Id, { displayName: string; photoURL: string | null }>
  requestId: Id | null
  /**
   * Oficio por el que se originó la conversación. Un profesional puede ser
   * jardinero y electricista a la vez: esto permite mostrar "te escribieron
   * por jardinería" y filtrar la casilla por oficio.
   */
  categoryId: Id | null
  /** Título de la solicitud, para ubicar la charla de un vistazo. */
  requestTitle: string | null
  lastMessage: string
  lastMessageAt: Timestamp | null
  lastMessageSenderId: Id | null
  /** uid -> cantidad de mensajes sin leer. Lo actualiza una Cloud Function. */
  unreadCount: Record<Id, number>
  /**
   * Estado de la solicitud que originó el chat, copiado acá por una Cloud
   * Function: la casilla necesita saber si la charla está cerrada sin tener
   * que leer una solicitud por fila.
   */
  requestStatus: RequestStatus | null
  /**
   * Quiénes archivaron esta conversación. El borrado es de cada uno: sacarla
   * de tu casilla no se la saca al otro. Si llega un mensaje nuevo la lista se
   * vacía y el chat reaparece, para que nadie quede incomunicado sin saberlo.
   */
  hiddenFor: Id[]
  createdAt: Timestamp
}

export type MessageKind = 'text' | 'image' | 'system'

export interface Message {
  id: Id
  chatId: Id
  senderId: Id
  kind: MessageKind
  text: string
  imageUrl: string | null
  readBy: Id[]
  createdAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* reviews/{id}                                                               */
/* -------------------------------------------------------------------------- */

/** Una reseña por solicitud completada: el id del doc es el `requestId`. */
export interface Review {
  id: Id
  requestId: Id
  professionalId: Id
  authorId: Id
  authorName: string
  authorPhotoURL: string | null
  /** 1 a 5. */
  rating: number
  comment: string
  /** Derechos de réplica del profesional. */
  reply: { text: string; createdAt: Timestamp } | null
  /** Reportada por abuso; se oculta hasta moderar. */
  hidden: boolean
  createdAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* users/{uid}/notifications/{id}                                             */
/* -------------------------------------------------------------------------- */

export type NotificationType =
  | 'request_received'
  | 'request_accepted'
  | 'request_rejected'
  | 'request_completed'
  | 'request_cancelled'
  | 'message_received'
  | 'review_received'

export interface AppNotification {
  id: Id
  type: NotificationType
  title: string
  body: string
  /** Ruta interna a la que navega el tap. Ej: "/chats/abc123". */
  link: string
  read: boolean
  createdAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* users/{uid}/favorites/{professionalId}                                     */
/* -------------------------------------------------------------------------- */

export interface Favorite {
  professionalId: Id
  displayName: string
  photoURL: string | null
  categoryIds: Id[]
  createdAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* users/{uid}/blocked/{blockedUid}                                           */
/* -------------------------------------------------------------------------- */

/**
 * Alguien a quien bloqueaste. El id del documento es su uid.
 *
 * Guarda el nombre y la foto copiados para poder dibujar la lista de
 * bloqueados sin leer un perfil por fila. Si esa persona se cambia el nombre,
 * acá queda el que tenía: alcanza para reconocerla y desbloquearla.
 */
export interface Block {
  uid: Id
  displayName: string
  photoURL: string | null
  createdAt: Timestamp
}

/* -------------------------------------------------------------------------- */
/* reports/{id}                                                               */
/* -------------------------------------------------------------------------- */

export type ReportTargetType = 'user' | 'professional' | 'review' | 'message'
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'

export type ReportReason = 'spam' | 'fraud' | 'abuse' | 'fake_profile' | 'no_show' | 'other'

/** Denuncia hecha por un usuario. Solo la lee y resuelve un admin. */
export interface Report {
  id: Id
  reporterId: Id
  targetType: ReportTargetType
  /** uid, reviewId o messageId según `targetType`. */
  targetId: Id
  reason: ReportReason
  details: string
  status: ReportStatus
  /** Notas internas y resolución del admin. */
  resolution: string | null
  resolvedBy: Id | null
  resolvedAt: Timestamp | null
  createdAt: Timestamp
}
