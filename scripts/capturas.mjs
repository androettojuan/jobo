/**
 * Capturas del README.
 *
 *   npm run capturas
 *
 * Corre dentro de `firebase emulators:exec` con un proyecto `demo-` y puertos
 * propios (`firebase.capturas.json`), así que nunca toca producción ni choca
 * con otros emuladores abiertos. Carga un pueblo de ejemplo, fotografía cada
 * pantalla a tamaño de teléfono y arma las composiciones que muestra el README
 * en `docs/capturas/`.
 */
import { mkdir, readFile } from 'node:fs/promises'

import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const PROJECT = 'demo-jobo'
const AUTH_PORT = 9399
const FIRESTORE_PORT = 8380
const AUTH = `http://127.0.0.1:${AUTH_PORT}`
const PORT = 5299
const APP = `http://localhost:${PORT}`
const OUT = 'docs/capturas'
const SHOTS = 'docs/capturas/pantallas'
const PASSWORD = 'jobo123456'

/* -------------------------------------------------------------------------- */
/* El pueblo de ejemplo                                                       */
/* -------------------------------------------------------------------------- */

const RUMIPAL = { id: 'villa-rumipal', name: 'Villa Rumipal', province: 'Córdoba' }
const SANTA_ROSA = {
  id: 'santa-rosa-de-calamuchita',
  name: 'Santa Rosa de Calamuchita',
  province: 'Córdoba',
}
const DIQUE = { id: 'villa-del-dique', name: 'Villa del Dique', province: 'Córdoba' }
const BELGRANO = {
  id: 'villa-general-belgrano',
  name: 'Villa General Belgrano',
  province: 'Córdoba',
}
const EMBALSE = { id: 'embalse', name: 'Embalse', province: 'Córdoba' }

/** Vecinos: piden trabajos. `pedro` es el protagonista del lado del cliente. */
const NEIGHBORS = {
  pedro: { name: 'Pedro Díaz', phone: '3546 41-2290', locality: RUMIPAL },
  lucia: { name: 'Lucía Ferreyra', phone: '3546 40-7781', locality: RUMIPAL },
  monica: { name: 'Mónica Aguirre', phone: null, locality: DIQUE },
  jorge: { name: 'Jorge Villalba', phone: '3546 52-0134', locality: RUMIPAL },
  laura: { name: 'Laura Benítez', phone: null, locality: SANTA_ROSA },
  esteban: { name: 'Esteban Paz', phone: null, locality: EMBALSE },
  admin: { name: 'Juan Manuel', phone: null, locality: RUMIPAL, admin: true },
}

/**
 * Profesionales. `ana` es la protagonista del lado del que trabaja: tiene dos
 * oficios, así se ve el filtro por oficio del panel y de la casilla.
 */
const PROS = {
  ana: {
    name: 'Ana Gómez',
    phone: '3546 43-5512',
    phoneIsPublic: false,
    categoryIds: ['jardineria', 'electricista'],
    headline: 'Jardinería y electricidad domiciliaria',
    description:
      'Mantenimiento de parques, poda y riego por goteo. También hago instalaciones eléctricas chicas: tomas, luminarias, tableros.\nTengo herramientas propias y trabajo de lunes a sábado.',
    locality: RUMIPAL,
    areas: [RUMIPAL, DIQUE, SANTA_ROSA],
    rate: [9000, 14000],
    verified: true,
    rating: [4.8, 18],
    completedJobs: 31,
  },
  roberto: {
    name: 'Roberto Sosa',
    phone: '3546 45-9087',
    phoneIsPublic: true,
    categoryIds: ['plomero', 'gasista'],
    headline: 'Gasista matriculado · 20 años en el valle',
    description:
      'Instalaciones de gas y agua, termotanques, calefones y destapaciones. Hago presupuesto sin cargo dentro de Villa Rumipal.\nUrgencias también los domingos.',
    locality: RUMIPAL,
    areas: [RUMIPAL, DIQUE, EMBALSE, SANTA_ROSA],
    rate: [12000, 18000],
    verified: true,
    rating: [4.9, 27],
    completedJobs: 64,
  },
  marcelo: {
    name: 'Marcelo Quiroga',
    categoryIds: ['electricista'],
    headline: 'Electricista matriculado',
    description: 'Instalaciones nuevas, reformas y certificados para EPEC.',
    locality: SANTA_ROSA,
    areas: [SANTA_ROSA, RUMIPAL, BELGRANO],
    rate: [11000, null],
    verified: true,
    rating: [4.6, 11],
    completedJobs: 19,
  },
  silvina: {
    name: 'Silvina Ledesma',
    categoryIds: ['limpieza'],
    headline: 'Limpieza de casas y cabañas',
    description: 'Limpieza por hora, de fin de obra y recambio de cabañas para alquiler.',
    locality: RUMIPAL,
    areas: [RUMIPAL, DIQUE],
    rate: [6000, 7500],
    verified: false,
    rating: [5, 9],
    completedJobs: 22,
  },
  diego: {
    name: 'Diego Moyano',
    categoryIds: ['piletas', 'jardineria'],
    headline: 'Piletas y parques',
    description: 'Puesta a punto de piletas para la temporada y mantenimiento semanal.',
    locality: DIQUE,
    areas: [DIQUE, RUMIPAL, EMBALSE],
    rate: [8000, 12000],
    verified: true,
    rating: [4.7, 14],
    completedJobs: 25,
  },
  carlos: {
    name: 'Carlos Bustos',
    categoryIds: ['albanil', 'pintor'],
    headline: 'Albañilería y pintura en general',
    description: 'Revoques, contrapisos, refacciones y pintura de interiores y exteriores.',
    locality: RUMIPAL,
    areas: [RUMIPAL],
    rate: [null, null],
    verified: false,
    rating: [4.3, 6],
    completedJobs: 8,
  },
  hernan: {
    name: 'Hernán Ríos',
    categoryIds: ['mecanico', 'gomeria'],
    headline: 'Mecánica ligera y gomería',
    description: 'Service, frenos, tren delantero. Gomería con auxilio en ruta.',
    locality: RUMIPAL,
    areas: [RUMIPAL, EMBALSE],
    rate: [10000, null],
    verified: true,
    rating: [4.5, 12],
    completedJobs: 40,
  },
  valeria: {
    name: 'Valeria Castro',
    categoryIds: ['peluqueria'],
    headline: 'Peluquería a domicilio',
    description: 'Cortes, color y peinados para eventos. Voy a tu casa.',
    locality: RUMIPAL,
    areas: [RUMIPAL, DIQUE],
    rate: [null, null],
    verified: false,
    rating: [4.9, 15],
    completedJobs: 30,
  },
  pablo: {
    name: 'Pablo Arias',
    categoryIds: ['carpintero', 'herrero'],
    headline: 'Carpintería y herrería a medida',
    description: 'Muebles, decks, portones y rejas.',
    locality: RUMIPAL,
    areas: [RUMIPAL],
    rate: [null, null],
    verified: false,
    rating: [0, 0],
    completedJobs: 0,
  },
  gabriel: {
    name: 'Gabriel Torres',
    categoryIds: ['fletes'],
    headline: 'Fletes y mudanzas',
    description: 'Camioneta con caja cerrada. Viajes a Córdoba capital.',
    locality: RUMIPAL,
    areas: [RUMIPAL, SANTA_ROSA, EMBALSE],
    rate: [15000, null],
    verified: true,
    rating: [4.4, 7],
    completedJobs: 12,
  },
  norma: {
    name: 'Norma Peralta',
    categoryIds: ['cuidado-adultos'],
    headline: 'Acompañante terapéutica',
    description: 'Cuidado de adultos mayores, de día o de noche.',
    locality: RUMIPAL,
    areas: [RUMIPAL],
    rate: [5000, null],
    verified: true,
    rating: [5, 4],
    completedJobs: 5,
  },
  martin: {
    name: 'Martín Ojeda',
    categoryIds: ['informatica'],
    headline: 'Service de PC y redes',
    description: 'Arreglo de computadoras, WiFi en casas y cabañas.',
    locality: RUMIPAL,
    areas: [RUMIPAL, DIQUE],
    rate: [8000, null],
    verified: false,
    rating: [4.6, 8],
    completedJobs: 14,
  },
  sergio: {
    name: 'Sergio Luna',
    categoryIds: ['electricista', 'refrigeracion'],
    headline: 'Electricidad y aire acondicionado',
    description: 'Instalación y carga de equipos split.',
    locality: DIQUE,
    areas: [DIQUE, RUMIPAL],
    rate: [10000, 15000],
    verified: false,
    rating: [4.2, 5],
    completedJobs: 7,
  },
}

const slugEmail = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '') + '@ejemplo.com'

const PEOPLE = { ...NEIGHBORS, ...PROS }
for (const person of Object.values(PEOPLE)) person.email ??= slugEmail(person.name)

/* -------------------------------------------------------------------------- */
/* Carga                                                                      */
/* -------------------------------------------------------------------------- */

/** Mañana a las 9, hora de Argentina: la cita que acuerdan en el chat. */
function tomorrowAt9() {
  const d = new Date(Date.now() + 24 * 3600_000)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12)
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

async function signUp(person) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: person.email,
      password: PASSWORD,
      displayName: person.name,
      returnSecureToken: true,
    }),
  })
  if (!res.ok) throw new Error(`Emulador de Auth: ${res.status} ${await res.text()}`)
  const { localId } = await res.json()

  if (person.admin) {
    // El rol de admin es un custom claim, igual que en producción.
    const claim = await fetch(
      `${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
        body: JSON.stringify({ localId, customAttributes: JSON.stringify({ admin: true }) }),
      },
    )
    if (!claim.ok) throw new Error(`Custom claim: ${claim.status} ${await claim.text()}`)
  }
  return localId
}

async function seed() {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })
  const uid = {}
  for (const [key, person] of Object.entries(PEOPLE)) uid[key] = await signUp(person)

  const env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { host: '127.0.0.1', port: FIRESTORE_PORT },
  })
  await env.clearFirestore()

  const now = Date.now()
  const at = (ago) => firebase.firestore.Timestamp.fromMillis(now - ago)

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()

    /* --- Usuarios y profesionales --- */
    for (const [key, p] of Object.entries(PEOPLE)) {
      const isPro = key in PROS
      await db.doc(`users/${uid[key]}`).set({
        uid: uid[key],
        displayName: p.name,
        email: p.email,
        phone: p.phone ?? null,
        phoneIsPublic: p.phoneIsPublic ?? false,
        photoURL: null,
        locality: p.locality,
        isProfessional: isPro,
        fcmTokens: [],
        disabled: false,
        createdAt: at(90 * DAY),
        updatedAt: at(2 * DAY),
      })
    }

    const stats = { total: {}, byLocality: {} }
    for (const [i, [key, p]] of Object.entries(PROS).entries()) {
      await db.doc(`professionals/${uid[key]}`).set({
        uid: uid[key],
        displayName: p.name,
        photoURL: null,
        categoryIds: p.categoryIds,
        headline: p.headline,
        description: p.description,
        locality: p.locality,
        serviceAreaIds: p.areas.map((a) => a.id),
        hourlyRateFrom: p.rate[0],
        hourlyRateTo: p.rate[1],
        photos: [],
        publicPhone: p.phoneIsPublic ? p.phone : null,
        status: 'active',
        verified: p.verified,
        ratingAvg: p.rating[0],
        ratingCount: p.rating[1],
        completedJobs: p.completedJobs,
        avgResponseMs: 40 * MIN,
        answeredRequests: p.completedJobs,
        createdAt: at((80 - i * 5) * DAY),
        updatedAt: at(3 * DAY),
      })
      // Lo que en producción mantiene la Cloud Function de estadísticas.
      for (const c of p.categoryIds) {
        stats.total[c] = (stats.total[c] ?? 0) + 1
        for (const a of p.areas) {
          stats.byLocality[a.id] ??= {}
          stats.byLocality[a.id][c] = (stats.byLocality[a.id][c] ?? 0) + 1
        }
      }
    }
    await db.doc('stats/categories').set(stats)

    /* --- Solicitudes, cada una con su chat --- */
    const requests = [
      {
        id: 'termotanque',
        client: 'pedro',
        pro: 'roberto',
        categoryId: 'gasista',
        title: 'Pierde agua el termotanque',
        description:
          'Es a gas, de 80 litros. Gotea por abajo, cerca de la válvula, y deja un charco cada mañana.',
        status: 'accepted',
        ago: 26 * HOUR,
        preferredAt: tomorrowAt9(),
        messages: [
          ['roberto', 'Hola Pedro, ¿hace cuánto que gotea?', 25 * HOUR],
          ['pedro', 'Desde el fin de semana. Le puse un balde abajo por ahora.', 24 * HOUR],
          [
            'roberto',
            'Por lo que contás es la válvula de seguridad. Se cambia en el día.',
            23 * HOUR,
          ],
          ['pedro', 'Buenísimo. ¿Más o menos cuánto sale?', 23 * HOUR - 20 * MIN],
          [
            'roberto',
            'Entre repuesto y mano de obra, unos $45.000. Si es otra cosa te aviso antes de tocar nada.',
            22 * HOUR,
          ],
          ['pedro', 'Dale, de acuerdo. Es en Los Aromos 245.', 21 * HOUR],
          ['roberto', '¿Te queda bien mañana a las 9?', 40 * MIN],
          ['roberto', 'Llevo la válvula por las dudas, así lo dejamos andando.', 38 * MIN],
        ],
        unread: { pedro: 2, roberto: 0 },
      },
      {
        id: 'poda',
        client: 'pedro',
        pro: 'ana',
        categoryId: 'jardineria',
        title: 'Poda de dos sauces',
        description:
          'Tengo dos sauces grandes en el fondo que ya tocan los cables. Necesito podarlos antes de la tormenta.',
        status: 'pending',
        ago: 3 * HOUR,
        messages: [],
        unread: { pedro: 0, ana: 1 },
      },
      {
        id: 'limpieza-obra',
        client: 'pedro',
        pro: 'silvina',
        categoryId: 'limpieza',
        title: 'Limpieza final de obra',
        description: 'Terminamos de pintar el living y quedó todo con polvo y pintura en el piso.',
        status: 'completed',
        ago: 6 * DAY,
        messages: [
          ['silvina', 'Hola Pedro, puedo ir el jueves a la mañana.', 6 * DAY - HOUR],
          ['pedro', 'Perfecto, te espero.', 6 * DAY - 2 * HOUR],
          ['silvina', '¡Listo! Quedó todo limpio. Gracias por elegirme.', 2 * DAY],
        ],
        unread: { pedro: 0, silvina: 0 },
      },
      {
        id: 'horno',
        client: 'pedro',
        pro: 'marcelo',
        categoryId: 'electricista',
        title: 'Salta la térmica al prender el horno',
        description: 'Cada vez que prendo el horno eléctrico se corta la luz de toda la casa.',
        status: 'completed',
        ago: 21 * DAY,
        messages: [['marcelo', 'Era el diferencial. Ya quedó cambiado.', 18 * DAY]],
        unread: { pedro: 0, marcelo: 0 },
        review: {
          rating: 5,
          comment: 'Vino el mismo día, encontró la falla enseguida y dejó todo prolijo.',
        },
      },
      {
        id: 'pintura',
        client: 'pedro',
        pro: 'carlos',
        categoryId: 'pintor',
        title: 'Pintar el frente de la casa',
        description: 'Frente de unos 8 metros, revoque en buen estado.',
        status: 'cancelled',
        ago: 34 * DAY,
        messages: [['pedro', 'Al final lo vamos a dejar para el verano, gracias igual.', 33 * DAY]],
        unread: { pedro: 0, carlos: 0 },
      },
      {
        id: 'quincho',
        client: 'lucia',
        pro: 'ana',
        categoryId: 'electricista',
        title: 'Luces para el quincho',
        description: 'Quiero poner cuatro apliques y una guirnalda en el quincho, con su llave.',
        status: 'pending',
        ago: 50 * MIN,
        messages: [],
        unread: { lucia: 0, ana: 1 },
      },
      {
        id: 'pasto',
        client: 'monica',
        pro: 'ana',
        categoryId: 'jardineria',
        title: 'Corte de pasto cada quince días',
        description: 'Casa de fin de semana, unos 600 m² de parque. Busco a alguien fijo.',
        status: 'in_progress',
        ago: 9 * DAY,
        messages: [
          ['ana', 'Hola Mónica, puedo ir martes por medio.', 9 * DAY - HOUR],
          ['monica', 'Me sirve. La llave del portón la tiene el vecino.', 9 * DAY - 2 * HOUR],
          ['monica', '¿Podrás pasar también por los rosales?', 2 * HOUR],
        ],
        unread: { monica: 0, ana: 1 },
      },
      {
        id: 'tablero',
        client: 'jorge',
        pro: 'ana',
        categoryId: 'electricista',
        title: 'Cambiar el tablero eléctrico',
        description: 'El tablero es viejo, con tapones. Quiero pasarlo a térmicas y disyuntor.',
        status: 'accepted',
        ago: 2 * DAY,
        messages: [
          ['ana', 'Hola Jorge, el viernes paso a ver el tablero y te paso precio.', 2 * DAY - HOUR],
          ['jorge', 'Gracias Ana, nos vemos el viernes.', 30 * HOUR],
        ],
        unread: { jorge: 0, ana: 0 },
      },
      {
        id: 'tomacorriente',
        client: 'laura',
        pro: 'ana',
        categoryId: 'electricista',
        title: 'Tomacorriente quemado en la cocina',
        description: 'Se quemó el toma de la heladera, está negro.',
        status: 'completed',
        ago: 15 * DAY,
        messages: [['laura', '¡Gracias Ana! Quedó perfecto.', 14 * DAY]],
        unread: { laura: 0, ana: 0 },
        review: { rating: 5, comment: 'Súper responsable, lo resolvió en media hora.' },
      },
      {
        id: 'riego',
        client: 'esteban',
        pro: 'ana',
        categoryId: 'jardineria',
        title: 'Riego por goteo en la huerta',
        description: 'Huerta de 20 m² en Embalse.',
        status: 'rejected',
        ago: 20 * DAY,
        messages: [['ana', 'Perdón Esteban, Embalse me queda fuera de zona.', 20 * DAY - HOUR]],
        unread: { esteban: 0, ana: 0 },
      },
    ]

    for (const r of requests) {
      const clientId = uid[r.client]
      const proId = uid[r.pro]
      const chatId = `chat-${r.id}`
      const client = PEOPLE[r.client]
      const last = r.messages.at(-1)
      await db.doc(`requests/${r.id}`).set({
        clientId,
        professionalId: proId,
        participantIds: [clientId, proId],
        categoryId: r.categoryId,
        title: r.title,
        description: r.description,
        photos: [],
        locality: client.locality,
        status: r.status,
        preferredAt: r.preferredAt ? firebase.firestore.Timestamp.fromMillis(r.preferredAt) : null,
        chatId,
        completedAt: r.status === 'completed' ? at(r.ago - DAY) : null,
        cancelledBy: r.status === 'cancelled' ? clientId : null,
        createdAt: at(r.ago),
        updatedAt: at(last ? last[2] : r.ago),
      })

      await db.doc(`chats/${chatId}`).set({
        participantIds: [clientId, proId],
        participants: {
          [clientId]: { displayName: client.name, photoURL: null },
          [proId]: { displayName: PROS[r.pro].name, photoURL: null },
        },
        requestId: r.id,
        categoryId: r.categoryId,
        requestTitle: r.title,
        lastMessage: last ? last[1] : r.title,
        lastMessageAt: at(last ? last[2] : r.ago),
        lastMessageSenderId: last ? uid[last[0]] : clientId,
        unreadCount: Object.fromEntries(Object.entries(r.unread).map(([k, n]) => [uid[k], n])),
        requestStatus: r.status,
        hiddenFor: [],
        createdAt: at(r.ago),
      })

      // El primer mensaje lo escribe la Cloud Function con el pedido.
      const messages = db.collection(`chats/${chatId}/messages`)
      await messages.add({
        chatId,
        senderId: clientId,
        kind: 'system',
        text: `${r.title}\n\n${r.description}`,
        imageUrl: null,
        readBy: [clientId, proId],
        createdAt: at(r.ago),
      })
      for (const [who, text, ago] of r.messages) {
        await messages.add({
          chatId,
          senderId: uid[who],
          kind: 'text',
          text,
          imageUrl: null,
          readBy: [uid[who]],
          createdAt: at(ago),
        })
      }

      if (r.review) {
        await db.doc(`reviews/${r.id}`).set({
          requestId: r.id,
          professionalId: proId,
          authorId: clientId,
          authorName: client.name,
          authorPhotoURL: null,
          rating: r.review.rating,
          comment: r.review.comment,
          reply: null,
          hidden: false,
          createdAt: at(r.ago - 2 * DAY),
        })
      }
    }

    /* --- Más reseñas, para que las fichas no se vean vacías --- */
    const extraReviews = [
      [
        'roberto',
        'Graciela M.',
        5,
        'Me cambió el calefón un domingo a la noche. Un genio.',
        4,
        'Gracias Graciela, a disposición.',
      ],
      ['roberto', 'Hugo R.', 5, 'Prolijo y cumplió con el precio que me pasó.', 12, null],
      [
        'roberto',
        'Carla S.',
        4,
        'Muy buen trabajo, llegó un rato más tarde de lo acordado.',
        25,
        'Perdón por la demora, se complicó el trabajo anterior.',
      ],
      ['roberto', 'Daniel F.', 5, 'Detectó una pérdida de gas que nadie encontraba.', 40, null],
      [
        'ana',
        'Mónica A.',
        5,
        'Dejó el parque hermoso y se llevó todas las ramas.',
        30,
        '¡Gracias Mónica! Nos vemos en primavera.',
      ],
      ['ana', 'Ricardo T.', 4, 'Buen trabajo con las luminarias del patio.', 45, null],
      ['silvina', 'Patricia L.', 5, 'Impecable, la recomiendo para cabañas.', 10, null],
      ['diego', 'Fernando G.', 5, 'La pileta quedó cristalina para el verano.', 20, null],
    ]
    for (const [i, [pro, author, rating, comment, days, reply]] of extraReviews.entries()) {
      await db.doc(`reviews/extra-${i}`).set({
        requestId: `extra-${i}`,
        professionalId: uid[pro],
        authorId: `vecino-${i}`,
        authorName: author,
        authorPhotoURL: null,
        rating,
        comment,
        reply: reply ? { text: reply, createdAt: at(days * DAY - DAY) } : null,
        hidden: false,
        createdAt: at(days * DAY),
      })
    }

    /* --- Avisos --- */
    const notify = (who, list) =>
      Promise.all(
        list.map(([type, title, body, link, read, ago], i) =>
          db.doc(`users/${uid[who]}/notifications/n${i}`).set({
            type,
            title,
            body,
            link,
            read,
            createdAt: at(ago),
          }),
        ),
      )
    await notify('pedro', [
      [
        'message_received',
        'Roberto Sosa',
        'Te escribió un mensaje',
        '/chats/chat-termotanque',
        false,
        38 * MIN,
      ],
      [
        'request_accepted',
        'Aceptaron tu solicitud',
        'Ya podés coordinar por chat: Pierde agua el termotanque',
        '/solicitudes/termotanque',
        false,
        25 * HOUR,
      ],
      [
        'request_completed',
        '¿Cómo salió el trabajo?',
        'Calificá a quien te ayudó con: Limpieza final de obra',
        '/solicitudes/limpieza-obra/resena',
        true,
        2 * DAY,
      ],
      [
        'message_received',
        'Silvina Ledesma',
        'Te escribió un mensaje',
        '/chats/chat-limpieza-obra',
        true,
        2 * DAY,
      ],
      [
        'request_completed',
        '¿Cómo salió el trabajo?',
        'Calificá a quien te ayudó con: Salta la térmica al prender el horno',
        '/solicitudes/horno/resena',
        true,
        18 * DAY,
      ],
    ])
    await notify('ana', [
      [
        'request_received',
        'Nueva solicitud',
        'Lucía Ferreyra te pidió un presupuesto: Luces para el quincho',
        '/solicitudes/quincho',
        false,
        50 * MIN,
      ],
      [
        'message_received',
        'Mónica Aguirre',
        'Te escribió un mensaje',
        '/chats/chat-pasto',
        false,
        2 * HOUR,
      ],
      [
        'request_received',
        'Nueva solicitud',
        'Pedro Díaz te pidió un presupuesto: Poda de dos sauces',
        '/solicitudes/poda',
        false,
        3 * HOUR,
      ],
      [
        'review_received',
        'Laura Benítez te calificó',
        '5 estrellas. Súper responsable, lo resolvió en media hora.',
        `/profesional/${uid.ana}`,
        true,
        13 * DAY,
      ],
    ])

    /* --- Moderación --- */
    const reports = [
      [
        'fake_profile',
        'professional',
        uid.pablo,
        'Usa fotos de trabajos que son de otra empresa de Córdoba.',
        2 * HOUR,
      ],
      [
        'no_show',
        'professional',
        uid.sergio,
        'Quedamos para el sábado y nunca vino ni avisó.',
        DAY,
      ],
      ['abuse', 'review', 'extra-2', 'La reseña tiene datos personales míos.', 3 * DAY],
    ]
    for (const [i, [reason, targetType, targetId, details, ago]] of reports.entries()) {
      await db.doc(`reports/r${i}`).set({
        reporterId: uid.lucia,
        targetType,
        targetId,
        reason,
        details,
        status: 'open',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: at(ago),
      })
    }

    const proposed = [
      ['afilador', 'Afilador', 'pablo'],
      ['plomeria', 'Plomería', 'sergio'],
      ['apicultor', 'Apicultor', 'martin'],
    ]
    for (const [id, name, by] of proposed) {
      await db.doc(`categories/${id}`).set({
        id,
        name,
        icon: 'wrench',
        order: 999,
        active: false,
        status: 'pending',
        proposedBy: uid[by],
        mergedInto: null,
      })
    }
  })
  await env.cleanup()
  return uid
}

/* -------------------------------------------------------------------------- */
/* Capturas                                                                   */
/* -------------------------------------------------------------------------- */

const PHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'es-AR',
  timezoneId: 'America/Argentina/Buenos_Aires',
}

/** Abre un teléfono con Villa Rumipal ya elegida y, si se pide, con sesión. */
async function session(browser, who, { dark = false } = {}) {
  const context = await browser.newContext({ ...PHONE, colorScheme: dark ? 'dark' : 'light' })
  const isPro = who in PROS
  await context.addInitScript(
    ([locality, pro]) => {
      localStorage.setItem('jobo:locality', JSON.stringify({ state: { locality }, version: 0 }))
      localStorage.setItem('jobo:install-dismissed', '1')
      localStorage.setItem('jobo:is-professional', pro ? '1' : '0')
    },
    [RUMIPAL, isPro],
  )
  const page = await context.newPage()
  if (!who) {
    await page.goto(APP)
    return page
  }

  await page.goto(`${APP}/login`)
  await page.getByLabel('Email').fill(PEOPLE[who].email)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL(APP + '/')
  await page.getByText(`Hola, ${PEOPLE[who].name.split(' ')[0]}`).waitFor()
  return page
}

/** Espera a que no quede ningún esqueleto de carga y a que las fuentes estén. */
async function settle(page) {
  await page
    .waitForFunction(() => document.querySelectorAll('.animate-pulse').length === 0, null, {
      timeout: 10_000,
    })
    .catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
}

async function shot(page, name) {
  await settle(page)
  await page.screenshot({ path: `${SHOTS}/${name}.png` })
  console.log('  ', name)
}

/** Navega dentro de la SPA, sin recargar: así no se repite el login. */
async function go(page, path) {
  await page.evaluate((p) => {
    history.pushState(null, '', p)
    dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

/** Desplaza el `<main>` (es el que scrollea, no la página). */
const scrollMain = (page, selectorOrText, gap = 16) =>
  page.evaluate(
    ([target, gap]) => {
      const main = document.querySelector('main')
      const el =
        [...document.querySelectorAll('h2, h1, summary, label, p')].find((e) =>
          e.textContent.trim().startsWith(target),
        ) ?? null
      if (main && el) main.scrollTop += el.getBoundingClientRect().top - gap
    },
    [selectorOrText, gap],
  )

async function visitorShots(browser) {
  const page = await session(browser, null)
  await page.getByText('Hogar y arreglos').waitFor()
  await shot(page, 'inicio')

  await page.getByRole('button', { name: /^Plomero/ }).click()
  await page.getByText(/resultados?$/).waitFor()
  await shot(page, 'busqueda-rubro')

  await page.getByRole('button', { name: 'Quitar el filtro de rubro' }).click()
  await page.getByLabel('Buscar profesionales').fill('pileta')
  await page.getByText(/resultados?$/).waitFor()
  await shot(page, 'busqueda-texto')

  await go(page, '/login')
  await page.getByLabel('Contraseña').waitFor()
  await shot(page, 'login')

  await go(page, '/registro')
  await page.getByRole('heading').first().waitFor()
  await shot(page, 'registro')
  await page.context().close()
}

async function clientShots(browser, uid, dark) {
  const sfx = dark ? '-oscuro' : ''
  const page = await session(browser, 'pedro', { dark })
  await shot(page, `inicio-sesion${sfx}`)

  await go(page, `/profesional/${uid.roberto}`)
  await page.getByText('Zonas donde trabaja').waitFor()
  await page.getByText('Graciela M.').waitFor()
  await shot(page, `ficha${sfx}`)
  if (dark) {
    await page.context().close()
    return
  }
  // Con el botón de contactar entero arriba, para que no se vea cortado.
  await scrollMain(page, 'Reseñas', 104)
  await shot(page, 'ficha-resenas')

  await go(page, `/profesional/${uid.diego}/solicitar`)
  await page.getByLabel('Resumen').fill('Poner a punto la pileta')
  await page
    .getByLabel('Contá el problema')
    .fill('Quedó verde después del invierno. Es de 8 x 4 y la bomba anda bien.')
  await shot(page, 'contactar')

  await go(page, '/solicitudes')
  await page.getByText('Pierde agua el termotanque').waitFor()
  await page.getByText(/^Cerradas/).click()
  await shot(page, 'solicitudes')

  await go(page, '/solicitudes/termotanque')
  await page.getByText(/^Llamar a/).waitFor()
  await shot(page, 'solicitud')

  await go(page, '/chats')
  await page.getByText('Roberto Sosa').waitFor()
  await shot(page, 'chats')

  await go(page, '/chats/chat-termotanque')
  await page.getByText('Llevo la válvula').waitFor()
  await shot(page, 'chat')

  await go(page, '/solicitudes/limpieza-obra/resena')
  await page
    .getByLabel('¿Cómo fue tu experiencia?')
    .fill('Dejó todo impecable, hasta los vidrios. Muy recomendable.')
  await shot(page, 'resena')

  await go(page, '/notificaciones')
  await page.getByText('Aceptaron tu solicitud').waitFor()
  await shot(page, 'avisos')

  await go(page, '/perfil')
  await page.getByLabel('Nombre y apellido').waitFor()
  await page.waitForFunction(() =>
    [...document.querySelectorAll('input')].some((i) => i.value === 'Pedro Díaz'),
  )
  await shot(page, 'perfil')
  await page.context().close()
}

async function proShots(browser, uid, dark) {
  const sfx = dark ? '-oscuro' : ''
  const page = await session(browser, 'ana', { dark })
  await go(page, '/mi-trabajo')
  await page.getByText('Luces para el quincho').waitFor()
  await shot(page, `mi-trabajo${sfx}`)
  if (dark) {
    await page.context().close()
    return
  }

  await page.getByRole('button', { name: 'Electricista' }).click()
  await shot(page, 'mi-trabajo-filtro')

  await go(page, '/solicitudes')
  await page.getByRole('button', { name: /Me pidieron/ }).click()
  await page.getByText('Corte de pasto').waitFor()
  await shot(page, 'me-pidieron')

  await go(page, '/solicitudes/quincho')
  await page.getByRole('button', { name: 'Aceptar' }).waitFor()
  await shot(page, 'solicitud-recibida')

  await go(page, '/chats')
  await page.getByText('Mónica Aguirre').waitFor()
  await shot(page, 'chats-profesional')

  await go(page, '/perfil/profesional')
  await page.getByLabel('Título').waitFor()
  await page.waitForFunction(() =>
    [...document.querySelectorAll('input')].some((i) => i.value.startsWith('Jardinería')),
  )
  await shot(page, 'perfil-profesional')
  await scrollMain(page, 'Oficios')
  await shot(page, 'perfil-profesional-oficios')

  await go(page, `/profesional/${uid.ana}`)
  await page.getByText('Zonas donde trabaja').waitFor()
  await scrollMain(page, 'Reseñas')
  await shot(page, 'ficha-propia')
  await page.context().close()
}

async function adminShots(browser) {
  const page = await session(browser, 'admin')
  await go(page, '/admin')
  await page.getByText('Perfil falso').waitFor()
  await shot(page, 'admin-denuncias')

  await go(page, '/admin/categorias')
  await page.getByText('Propuesto como “Afilador”').waitFor()
  await shot(page, 'admin-oficios')

  await go(page, '/admin/profesionales')
  await page.getByText('Roberto Sosa').waitFor()
  await shot(page, 'admin-profesionales')

  await go(page, '/admin/usuarios')
  await page.getByText('Pedro Díaz').waitFor()
  await shot(page, 'admin-usuarios')
  await page.context().close()
}

/* -------------------------------------------------------------------------- */
/* Composiciones: teléfonos lado a lado con un epígrafe, las que usa el README */
/* -------------------------------------------------------------------------- */

const COMPOSITES = {
  portada: [
    ['inicio', 'Los oficios de tu pueblo'],
    ['ficha', 'La ficha de cada profesional'],
    ['chat', 'Coordinás por chat'],
    ['mi-trabajo', 'Y si trabajás, tu panel'],
  ],
  buscar: [
    ['inicio', 'Inicio: oficios con disponibles'],
    ['busqueda-rubro', 'Filtrar por rubro'],
    ['busqueda-texto', 'O buscar por texto'],
  ],
  ficha: [
    ['ficha', 'Ficha del profesional'],
    ['ficha-resenas', 'Reseñas con réplica'],
    ['contactar', 'Pedir presupuesto'],
  ],
  solicitudes: [
    ['solicitudes', 'Mis solicitudes'],
    ['solicitud', 'Detalle y teléfono'],
    ['resena', 'Calificar al terminar'],
  ],
  chat: [
    ['chats', 'Casilla de chats'],
    ['chat', 'Conversación'],
    ['avisos', 'Avisos'],
  ],
  profesional: [
    ['mi-trabajo', 'Panel “Mi trabajo”'],
    ['solicitud-recibida', 'Aceptar o rechazar'],
    ['chats-profesional', 'Chats por oficio'],
    ['perfil-profesional', 'Editar el perfil'],
  ],
  cuenta: [
    ['login', 'Entrar'],
    ['registro', 'Crear cuenta'],
    ['perfil', 'Mi perfil'],
  ],
  admin: [
    ['admin-denuncias', 'Denuncias'],
    ['admin-oficios', 'Oficios propuestos'],
    ['admin-profesionales', 'Verificar profesionales'],
    ['admin-usuarios', 'Suspender cuentas'],
  ],
  oscuro: [
    ['inicio-sesion-oscuro', 'Inicio'],
    ['ficha-oscuro', 'Ficha'],
    ['mi-trabajo-oscuro', 'Mi trabajo'],
  ],
}

async function composites(browser) {
  const page = await browser.newPage({ deviceScaleFactor: 1.5 })
  for (const [name, items] of Object.entries(COMPOSITES)) {
    const imgs = await Promise.all(
      items.map(async ([file]) => (await readFile(`${SHOTS}/${file}.png`)).toString('base64')),
    )
    await page.setContent(`<!doctype html><html><head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap">
      <style>
        body { margin: 0; background: #e8f9f3; font-family: Inter, system-ui, sans-serif; }
        .row { display: inline-flex; gap: 36px; padding: 40px 44px 30px; }
        figure { margin: 0; text-align: center; }
        img { display: block; width: 300px; border-radius: 22px;
              box-shadow: 0 1px 2px #0002, 0 12px 32px #06876233; }
        figcaption { margin-top: 14px; font-size: 19px; color: #0f3d2f; min-height: 24px; }
      </style></head><body><div class="row">
      ${items
        .map(
          ([, caption], i) =>
            `<figure><img src="data:image/png;base64,${imgs[i]}"><figcaption>${caption}</figcaption></figure>`,
        )
        .join('')}
      </div></body></html>`)
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.row').screenshot({ path: `${OUT}/${name}.png` })
    console.log('  ', `${name}.png`)
  }
  await page.close()
}

/* -------------------------------------------------------------------------- */

await mkdir(SHOTS, { recursive: true })
console.log('Cargando el pueblo de ejemplo…')
const uid = await seed()

Object.assign(process.env, {
  VITE_USE_EMULATORS: 'true',
  VITE_FIREBASE_API_KEY: 'demo-key',
  VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT}.firebaseapp.com`,
  VITE_FIREBASE_PROJECT_ID: PROJECT,
  VITE_FIREBASE_STORAGE_BUCKET: `${PROJECT}.appspot.com`,
  VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000',
  VITE_FIREBASE_VAPID_KEY: '',
})

const server = await createServer({
  server: { port: PORT, strictPort: true },
  logLevel: 'warn',
  plugins: [
    {
      // La app apunta a los puertos por defecto de los emuladores; acá corren
      // en otros, para convivir con un `npm run emulators` abierto.
      name: 'puertos-de-capturas',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('/src/lib/firebase.ts')) return
        return code
          .replace("'http://127.0.0.1:9099'", `'${AUTH}'`)
          .replace("'127.0.0.1', 8080", `'127.0.0.1', ${FIRESTORE_PORT}`)
      },
    },
  ],
})
await server.listen()

// Los campos de fecha siguen el idioma del navegador, no el de la página:
// sin esto el de "¿Cuándo te vendría bien?" sale como mm/dd/yyyy.
const browser = await chromium.launch({
  args: ['--lang=es-AR'],
  env: { ...process.env, LANG: 'es_AR.UTF-8' },
})
try {
  console.log('Pantallas:')
  await visitorShots(browser)
  await clientShots(browser, uid, false)
  await clientShots(browser, uid, true)
  await proShots(browser, uid, false)
  await proShots(browser, uid, true)
  await adminShots(browser)
  console.log('Composiciones:')
  await composites(browser)
} finally {
  await browser.close()
  await server.close()
}
