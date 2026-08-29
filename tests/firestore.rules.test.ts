import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  asAdmin,
  CLIENT,
  createTestEnv,
  PRO,
  professionalDoc,
  requestDoc,
  STRANGER,
} from './helpers'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await createTestEnv()
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
})

/** Escribe datos de arranque saltándose las reglas. */
async function seed(write: (db: ReturnType<typeof asAdmin>) => Promise<unknown>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await write(context.firestore() as ReturnType<typeof asAdmin>)
  })
}

describe('solicitudes', () => {
  beforeEach(async () => {
    await seed((db) => setDoc(doc(db, 'requests/req-1'), requestDoc()))
  })

  it('las ve quien participa', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertSucceeds(getDoc(doc(db, 'requests/req-1')))
  })

  it('no las ve un tercero', async () => {
    const db = env.authenticatedContext(STRANGER).firestore()
    await assertFails(getDoc(doc(db, 'requests/req-1')))
  })

  it('el profesional puede aceptar', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertSucceeds(updateDoc(doc(db, 'requests/req-1'), { status: 'accepted' }))
  })

  it('el cliente NO puede aceptar su propia solicitud', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(updateDoc(doc(db, 'requests/req-1'), { status: 'accepted' }))
  })

  it('no se puede saltar de pendiente a completada', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(updateDoc(doc(db, 'requests/req-1'), { status: 'completed' }))
  })

  it('el cliente puede cancelar mientras está pendiente', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertSucceeds(updateDoc(doc(db, 'requests/req-1'), { status: 'cancelled' }))
  })

  it('no se puede cambiar quién es el profesional', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(updateDoc(doc(db, 'requests/req-1'), { professionalId: STRANGER }))
  })

  it('no se puede crear una solicitud a nombre de otro', async () => {
    const db = env.authenticatedContext(STRANGER).firestore()
    await assertFails(setDoc(doc(db, 'requests/req-2'), requestDoc({ chatId: 'chat-2' })))
  })
})

describe('perfiles profesionales', () => {
  beforeEach(async () => {
    await seed((db) => setDoc(doc(db, 'professionals/profesional-1'), professionalDoc()))
  })

  it('son públicos', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'professionals/profesional-1')))
  })

  it('el dueño edita su descripción', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'professionals/profesional-1'), { description: 'Nueva' }),
    )
  })

  it('el dueño NO puede inflarse la calificación', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(updateDoc(doc(db, 'professionals/profesional-1'), { ratingAvg: 5 }))
  })

  it('el dueño NO puede autoverificarse', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(updateDoc(doc(db, 'professionals/profesional-1'), { verified: true }))
  })

  it('un admin sí puede verificarlo', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(env), 'professionals/profesional-1'), { verified: true }),
    )
  })

  it('un tercero no puede editarlo', async () => {
    const db = env.authenticatedContext(STRANGER).firestore()
    await assertFails(updateDoc(doc(db, 'professionals/profesional-1'), { headline: 'Hola' }))
  })
})

describe('reseñas', () => {
  const review = {
    requestId: 'req-1',
    professionalId: PRO,
    authorId: CLIENT,
    authorName: 'Cliente',
    authorPhotoURL: null,
    rating: 5,
    comment: 'Excelente',
    reply: null,
    hidden: false,
    createdAt: new Date(),
  }

  it('el cliente reseña una solicitud completada', async () => {
    await seed((db) => setDoc(doc(db, 'requests/req-1'), requestDoc({ status: 'completed' })))
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertSucceeds(setDoc(doc(db, 'reviews/req-1'), review))
  })

  it('no se puede reseñar una solicitud sin completar', async () => {
    await seed((db) => setDoc(doc(db, 'requests/req-1'), requestDoc()))
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(setDoc(doc(db, 'reviews/req-1'), review))
  })

  it('el profesional no puede reseñarse a sí mismo', async () => {
    await seed((db) => setDoc(doc(db, 'requests/req-1'), requestDoc({ status: 'completed' })))
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(setDoc(doc(db, 'reviews/req-1'), { ...review, authorId: PRO }))
  })

  it('rechaza una calificación fuera de 1 a 5', async () => {
    await seed((db) => setDoc(doc(db, 'requests/req-1'), requestDoc({ status: 'completed' })))
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(setDoc(doc(db, 'reviews/req-1'), { ...review, rating: 9 }))
  })

  it('el profesional solo puede responderla', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'requests/req-1'), requestDoc({ status: 'completed' }))
      await setDoc(doc(db, 'reviews/req-1'), review)
    })
    const db = env.authenticatedContext(PRO).firestore()

    await assertSucceeds(
      updateDoc(doc(db, 'reviews/req-1'), { reply: { text: 'Gracias', createdAt: new Date() } }),
    )
    await assertFails(updateDoc(doc(db, 'reviews/req-1'), { rating: 1 }))
  })
})

describe('chats', () => {
  const chat = {
    participantIds: [CLIENT, PRO],
    participants: {},
    requestId: 'req-1',
    categoryId: 'plomero',
    requestTitle: 'Pierde la canilla',
    lastMessage: 'Hola',
    lastMessageAt: new Date(),
    lastMessageSenderId: CLIENT,
    unreadCount: { [CLIENT]: 0, [PRO]: 1 },
    createdAt: new Date(),
  }

  beforeEach(async () => {
    await seed((db) => setDoc(doc(db, 'chats/chat-1'), chat))
  })

  it('un tercero no lee el chat', async () => {
    const db = env.authenticatedContext(STRANGER).firestore()
    await assertFails(getDoc(doc(db, 'chats/chat-1')))
  })

  it('un tercero no puede escribir mensajes', async () => {
    const db = env.authenticatedContext(STRANGER).firestore()
    await assertFails(
      setDoc(doc(db, 'chats/chat-1/messages/m-1'), {
        chatId: 'chat-1',
        senderId: STRANGER,
        kind: 'text',
        text: 'Hola',
        imageUrl: null,
        readBy: [STRANGER],
        createdAt: new Date(),
      }),
    )
  })

  it('no se puede escribir un mensaje a nombre de otro', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(
      setDoc(doc(db, 'chats/chat-1/messages/m-1'), {
        chatId: 'chat-1',
        senderId: PRO,
        kind: 'text',
        text: 'Hola',
        imageUrl: null,
        readBy: [PRO],
        createdAt: new Date(),
      }),
    )
  })

  it('un participante sí puede escribir', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'chats/chat-1/messages/m-1'), {
        chatId: 'chat-1',
        senderId: CLIENT,
        kind: 'text',
        text: 'Hola',
        imageUrl: null,
        readBy: [CLIENT],
        createdAt: new Date(),
      }),
    )
  })

  it('nadie puede tocar sus propios no leídos', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(updateDoc(doc(db, 'chats/chat-1'), { [`unreadCount.${PRO}`]: 0 }))
  })
})

describe('denuncias y oficios', () => {
  it('una denuncia nace abierta y a nombre propio', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    const report = {
      reporterId: CLIENT,
      targetType: 'professional',
      targetId: PRO,
      reason: 'fraud',
      details: 'Me cobró de más',
      status: 'open',
      resolution: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date(),
    }

    await assertSucceeds(setDoc(doc(db, 'reports/r-1'), report))
    await assertFails(setDoc(doc(db, 'reports/r-2'), { ...report, status: 'resolved' }))
    await assertFails(setDoc(doc(db, 'reports/r-3'), { ...report, reporterId: STRANGER }))
  })

  it('solo el admin resuelve denuncias', async () => {
    await seed((db) =>
      setDoc(doc(db, 'reports/r-1'), {
        reporterId: CLIENT,
        targetType: 'professional',
        targetId: PRO,
        reason: 'fraud',
        details: '',
        status: 'open',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date(),
      }),
    )

    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(updateDoc(doc(db, 'reports/r-1'), { status: 'resolved' }))
    await assertSucceeds(updateDoc(doc(asAdmin(env), 'reports/r-1'), { status: 'resolved' }))
  })

  it('un oficio propuesto no puede nacer activo', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    const category = {
      id: 'sodero',
      name: 'Sodero',
      icon: 'wrench',
      order: 999,
      proposedBy: PRO,
      mergedInto: null,
    }

    await assertSucceeds(
      setDoc(doc(db, 'categories/sodero'), { ...category, active: false, status: 'pending' }),
    )
    await assertFails(
      setDoc(doc(db, 'categories/sodero-2'), { ...category, active: true, status: 'active' }),
    )
  })
})

describe('perfil de usuario', () => {
  beforeEach(async () => {
    await seed((db) =>
      setDoc(doc(db, `users/${CLIENT}`), {
        uid: CLIENT,
        displayName: 'Cliente',
        email: 'cliente@test.com',
        phone: null,
        phoneIsPublic: false,
        photoURL: null,
        locality: null,
        isProfessional: false,
        fcmTokens: [],
        // Suspendido: el caso que importa es que no pueda levantarse la sanción.
        disabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
  })

  it('un usuario suspendido no puede levantarse la suspensión', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertFails(updateDoc(doc(db, `users/${CLIENT}`), { disabled: false }))
  })

  it('el dueño sí puede editar sus propios datos', async () => {
    const db = env.authenticatedContext(CLIENT).firestore()
    await assertSucceeds(updateDoc(doc(db, `users/${CLIENT}`), { phone: '3546551234' }))
  })

  it('un tercero no puede editar un perfil ajeno', async () => {
    const db = env.authenticatedContext(STRANGER).firestore()
    await assertFails(updateDoc(doc(db, `users/${CLIENT}`), { displayName: 'Hackeado' }))
  })

  it('el admin sí puede levantar la suspensión', async () => {
    await assertSucceeds(updateDoc(doc(asAdmin(env), `users/${CLIENT}`), { disabled: false }))
  })
})

it('las reglas de prueba se cargaron', () => {
  expect(env).toBeDefined()
})
