import { Bell, BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import {
  enablePushNotifications,
  markNotificationRead,
  subscribeToNotifications,
} from '@/features/notifications/api'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types/models'

export function NotificationsPage() {
  const { firebaseUser } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [pushState, setPushState] = useState<'idle' | 'working' | 'on' | 'blocked'>('idle')

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToNotifications(firebaseUser.uid, (list) => {
      setNotifications(list)
      setLoading(false)
    })
  }, [firebaseUser])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setPushState('on')
    }
  }, [])

  async function enablePush() {
    if (!firebaseUser) return
    setPushState('working')
    const token = await enablePushNotifications(firebaseUser.uid).catch(() => null)
    setPushState(token ? 'on' : 'blocked')
  }

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Notificaciones</h1>

      {pushState !== 'on' && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">Enterate al instante</p>
          <p className="text-sm text-slate-500">
            Activá los avisos para saber cuando te escriben o te aceptan una solicitud, aunque
            tengas la app cerrada.
          </p>
          {pushState === 'blocked' && (
            <p className="text-sm text-amber-600">
              El navegador bloqueó los avisos. Podés habilitarlos desde la configuración del sitio.
            </p>
          )}
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
