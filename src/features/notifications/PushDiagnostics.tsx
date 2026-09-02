import { useEffect, useState } from 'react'

import { getCurrentToken, getMessagingRegistration } from './api'
import { nativePermission } from './nativePush'
import { useAuth } from '@/features/auth/useAuth'
import { isNative, platform } from '@/lib/platform'

interface Estado {
  permiso: string
  serviceWorker: string
  suscripcion: string
  token: string
  guardado: string
}

/**
 * Qué ve el dispositivo sobre sí mismo. Cuando un push no llega, desde el
 * servidor todo se ve igual de bien: el token existe y FCM lo acepta. Esto
 * muestra la otra mitad, que solo se puede mirar desde el propio teléfono.
 */
export function PushDiagnostics() {
  const { profile, isAdmin } = useAuth()
  const [estado, setEstado] = useState<Estado | null>(null)

  useEffect(() => {
    // Sin admin no se dibuja nada, así que tampoco hace falta ir a mirar el
    // service worker ni pedirle el token a Firebase.
    if (!isAdmin) return

    let cancelado = false

    async function revisar(): Promise<Estado> {
      const guardadas = profile?.fcmTokens ?? []
      const enLaCuenta = (token: string | null) =>
        token
          ? guardadas.some((guardada) => guardada.token === token)
            ? 'sí, está en tu cuenta'
            : `NO está en tu cuenta (tiene ${guardadas.length})`
          : '—'

      // Adentro del contenedor nativo no hay service worker ni suscripción del
      // navegador: el token lo da el sistema operativo y el aviso lo dibuja él.
      if (isNative) {
        const token = await getCurrentToken().catch(() => null)
        return {
          permiso: await nativePermission(),
          serviceWorker: `no aplica (${platform})`,
          suscripcion: 'no aplica',
          token: token ? `${token.slice(0, 12)}…` : 'no se pudo obtener',
          guardado: enLaCuenta(token),
        }
      }

      const permiso = typeof Notification === 'undefined' ? 'sin soporte' : Notification.permission

      const registration = await getMessagingRegistration()
      if (!registration) {
        return {
          permiso,
          serviceWorker: 'no registrado',
          suscripcion: '—',
          token: '—',
          guardado: '—',
        }
      }

      const sw = registration.active
        ? 'activo'
        : registration.installing
          ? 'instalando'
          : 'inactivo'

      // La suscripción es lo que el navegador realmente tiene con el servicio
      // de push. Sin ella no llega nada, por más token que haya en Firestore.
      const subscription = await registration.pushManager.getSubscription()
      const suscripcion = subscription
        ? `sí (${new URL(subscription.endpoint).host})`
        : 'NO HAY — sin esto no llega ningún push'

      const token = await getCurrentToken().catch(() => null)

      return {
        permiso,
        serviceWorker: sw,
        suscripcion,
        token: token ? `${token.slice(0, 12)}…` : 'no se pudo obtener',
        guardado: enLaCuenta(token),
      }
    }

    revisar()
      .then((r) => {
        if (!cancelado) setEstado(r)
      })
      .catch(() => {
        if (!cancelado) setEstado(null)
      })

    return () => {
      cancelado = true
    }
  }, [profile, isAdmin])

  // Es una herramienta de soporte, no algo que le sirva a un vecino.
  if (!isAdmin) return null

  return (
    <details className="rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800">
      <summary className="cursor-pointer font-medium text-slate-500">Detalles técnicos</summary>
      {estado ? (
        <dl className="mt-2 flex flex-col gap-1">
          {[
            ['Permiso', estado.permiso],
            ['Service worker', estado.serviceWorker],
            ['Suscripción push', estado.suscripcion],
            ['Token de este equipo', estado.token],
            ['Registrado', estado.guardado],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-slate-500">No se pudo leer el estado.</p>
      )}
    </details>
  )
}
