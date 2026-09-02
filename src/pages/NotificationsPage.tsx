import { Bell, BellRing, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { AvatarListSkeleton } from '@/components/ui/skeletons'
import { useAuth } from '@/features/auth/useAuth'
import {
  clearNotifications,
  enablePushNotifications,
  markNotificationRead,
  PushError,
  showTestNotification,
  subscribeToNotifications,
} from '@/features/notifications/api'
import type { PushFailure } from '@/features/notifications/api'
import { PushDiagnostics } from '@/features/notifications/PushDiagnostics'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types/models'

const FAILURE_MESSAGE: Record<PushFailure, string> = {
  denied: 'El navegador bloqueó los avisos. Podés habilitarlos desde la configuración del sitio.',
  unsupported:
    'Este navegador no soporta avisos push. En iPhone hace falta instalar la app desde “Compartir → Agregar a inicio”.',
  'no-vapid-key': 'Falta configurar la clave de notificaciones de la app.',
  failed: 'No pudimos registrar este dispositivo. Recargá la página y probá de nuevo.',
}

export function NotificationsPage() {
  const { firebaseUser, isAdmin } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [pushState, setPushState] = useState<'idle' | 'working' | 'on' | 'failed'>('idle')
  const [failure, setFailure] = useState<PushFailure | null>(null)
  const [clearing, setClearing] = useState(false)
  const [listError, setListError] = useState('')
  const [testResult, setTestResult] = useState('')
  // Borrar no se deshace: el propio botón pide confirmación en un segundo
  // toque, así no hace falta un diálogo del navegador.
  const [confirmingClear, setConfirmingClear] = useState(false)

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToNotifications(
      firebaseUser.uid,
      (list) => {
        setNotifications(list)
        setListError('')
        setLoading(false)
      },
      () => {
        setListError('No pudimos cargar tus avisos. Revisá la conexión y volvé a entrar.')
        setLoading(false)
      },
    )
  }, [firebaseUser])

  // Tener el permiso del navegador no alcanza: sin token registrado el
  // servidor no tiene a dónde mandar el push, y el token puede faltar o haber
  // caducado. Si el permiso ya está dado lo registramos en silencio, sin
  // volver a preguntarle nada al usuario.
  useEffect(() => {
    if (!firebaseUser) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    let cancelled = false
    setPushState('working')
    enablePushNotifications(firebaseUser.uid)
      .then(() => {
        if (!cancelled) setPushState('on')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setPushState('failed')
        setFailure(e instanceof PushError ? e.reason : 'failed')
      })

    return () => {
      cancelled = true
    }
  }, [firebaseUser])

  async function testPush() {
    setTestResult('')
    try {
      await showTestNotification()
      setTestResult('Aviso enviado. Si no lo viste, tu teléfono los tiene apagados para Jobo.')
    } catch {
      setTestResult('Este dispositivo no pudo mostrar el aviso.')
    }
  }

  async function enablePush() {
    if (!firebaseUser) return
    setPushState('working')
    try {
      await enablePushNotifications(firebaseUser.uid)
      setPushState('on')
      setFailure(null)
    } catch (e) {
      setPushState('failed')
      setFailure(e instanceof PushError ? e.reason : 'failed')
    }
  }

  async function clearAll() {
    if (!firebaseUser || notifications.length === 0) return
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }

    setClearing(true)
    try {
      await clearNotifications(firebaseUser.uid)
      setListError('')
    } catch {
      setListError('No pudimos borrar los avisos. Probá de nuevo.')
    }
    setClearing(false)
    setConfirmingClear(false)
  }

  if (loading) return <AvatarListSkeleton />

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        {notifications.length > 0 && (
          <Button
            variant={confirmingClear ? 'danger' : 'ghost'}
            size="sm"
            loading={clearing}
            onClick={() => void clearAll()}
            onBlur={() => setConfirmingClear(false)}
          >
            <Trash2 className="size-4" aria-hidden />
            {confirmingClear ? 'Confirmar' : 'Limpiar'}
          </Button>
        )}
      </div>

      {pushState !== 'on' && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">Enterate al instante</p>
          <p className="text-sm text-slate-500">
            Activá los avisos para saber cuando te escriben o te aceptan una solicitud, aunque
            tengas la app cerrada.
          </p>
          {failure && <p className="text-sm text-amber-600">{FAILURE_MESSAGE[failure]}</p>}
          <Button
            size="sm"
            className="self-start"
            loading={pushState === 'working'}
            onClick={() => void enablePush()}
          >
            <BellRing className="size-4" aria-hidden />
            Activar avisos
          </Button>
        </div>
      )}

      {/* Con los avisos ya andando no hay nada que hacer acá, así que a un vecino
          no le mostramos nada. Al admin sí: es la herramienta que distingue "el
          teléfono los tiene apagados" de "el push no llega". */}
      {pushState === 'on' && isAdmin && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">Los avisos están activos en este dispositivo</p>
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onClick={() => void testPush()}
          >
            <BellRing className="size-4" aria-hidden />
            Probar un aviso
          </Button>
          {testResult && <p className="text-sm text-slate-500">{testResult}</p>}
        </div>
      )}

      <PushDiagnostics />

      {listError && <p className="text-sm text-red-600">{listError}</p>}

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No tenés novedades"
          description="Acá vas a ver los avisos de solicitudes, mensajes y calificaciones."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                to={notification.link}
                onClick={() => {
                  if (!notification.read && firebaseUser) {
                    void markNotificationRead(firebaseUser.uid, notification.id)
                  }
                }}
                className={cn('block py-3', !notification.read && 'font-medium')}
              >
                <p className="flex items-center gap-2">
                  {!notification.read && (
                    <span
                      className="size-2 shrink-0 rounded-full bg-brand-600"
                      aria-label="Sin leer"
                    />
                  )}
                  {notification.title}
                </p>
                <p className="text-sm font-normal text-slate-500">{notification.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
