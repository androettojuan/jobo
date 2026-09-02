import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useUnreadNotifications } from './useUnreadCount'
import { cn } from '@/lib/utils'

/**
 * Acceso al historial de avisos, con un punto rojo si hay sin leer.
 * Va dentro del contenido de cada pantalla —no en una barra fija— para que
 * acompañe el scroll en lugar de quedar flotando arriba de todo.
 */
export function NotificationsBell({ className }: { className?: string }) {
  const unread = useUnreadNotifications()

  return (
    <Link
      to="/notificaciones"
      aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'}
      className={cn(
        'relative shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      <Bell className="size-6" aria-hidden />
      {unread > 0 && (
        <span className="absolute top-1 right-1 size-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-950" />
      )}
    </Link>
  )
}
