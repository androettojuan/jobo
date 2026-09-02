import { Bell, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { onForegroundMessage, showSystemNotification } from './api'
import { onNativeNotificationTap } from './nativePush'
import { isNative } from '@/lib/platform'

interface Aviso {
  title: string
  body: string
  link: string
}

/**
 * Los push que llegan con la app abierta no los muestra el sistema: Firebase
 * los entrega a la página y, si nadie los atiende, se pierden en silencio.
 *
 * Con la app en pantalla se muestran como un cartel arriba de todo. Con la app
 * minimizada —viva pero sin nadie mirándola— un cartel no lo ve nadie, así que
 * ahí pedimos al sistema que muestre la notificación de verdad.
 */
export function ForegroundToast() {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false

    onForegroundMessage((title, body, link) => {
      if (document.visibilityState === 'visible') {
        setAviso({ title, body, link })
        return
      }
      void showSystemNotification(title, body, link)
    })
      .then((unsubscribe) => {
        if (cancelled) unsubscribe()
        else stop = unsubscribe
      })
      .catch(() => {})

    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  // Tocar el aviso en la barra de notificaciones abre la pantalla que
  // corresponde. En la web esto lo hace el `notificationclick` del service
  // worker; en nativo el aviso lo dibujó el sistema y avisa por acá.
  useEffect(() => {
    if (!isNative) return

    let stop: (() => void) | undefined
    let cancelled = false

    onNativeNotificationTap((link) => navigate(link))
      .then((unsubscribe) => {
        if (cancelled) unsubscribe()
        else stop = unsubscribe
      })
      .catch(() => {})

    return () => {
      cancelled = true
      stop?.()
    }
  }, [navigate])

  // Se va solo: es un aviso, no una tarea pendiente.
  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(timer)
  }, [aviso])

  if (!aviso) return null

  return (
    <div className="safe-top fixed inset-x-0 top-0 z-50 mx-auto max-w-2xl p-3">
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <Bell className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
        <button
          type="button"
          onClick={() => {
            navigate(aviso.link)
            setAviso(null)
          }}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium">{aviso.title}</p>
          <p className="truncate text-sm text-slate-500">{aviso.body}</p>
        </button>
        <button
          type="button"
          onClick={() => setAviso(null)}
          aria-label="Cerrar el aviso"
          className="-m-1 shrink-0 p-1 text-slate-400"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
