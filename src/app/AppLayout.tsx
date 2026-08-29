import { Bell, ClipboardList, Home, MessageCircle, Search, User } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { useUnreadChats } from '@/features/chat/useUnreadChats'
import { useUnreadNotifications } from '@/features/notifications/useUnreadCount'
import { InstallPrompt } from '@/features/pwa/InstallPrompt'
import { UpdatePrompt } from '@/features/pwa/UpdatePrompt'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/buscar', label: 'Buscar', icon: Search, end: false },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, end: false },
  { to: '/chats', label: 'Chats', icon: MessageCircle, end: false },
  { to: '/perfil', label: 'Perfil', icon: User, end: false },
]

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute top-0 right-1/4 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] leading-4 font-medium text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function AppLayout() {
  const { firebaseUser } = useAuth()
  const unreadChats = useUnreadChats()
  const unreadNotifications = useUnreadNotifications()
  const { pathname } = useLocation()

  // El chat ocupa toda la pantalla: barra y encabezado estorban.
  const immersive = /^\/chats\/[^/]+$/.test(pathname)

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      {!immersive && firebaseUser && (
        <div className="safe-top flex justify-end px-4 pt-2">
          <Link to="/notificaciones" className="relative p-2" aria-label="Notificaciones">
            <Bell className="size-5" aria-hidden />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-red-600" />
            )}
          </Link>
        </div>
      )}

      <main className={cn('flex-1 overflow-y-auto', immersive ? 'h-full' : 'safe-top pb-20')}>
        {!immersive && <InstallPrompt />}
        <Outlet />
      </main>

      <UpdatePrompt />

      {!immersive && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <ul className="flex">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'relative flex flex-col items-center gap-1 py-2 text-[11px] transition-colors',
                      isActive
                        ? 'text-brand-600 dark:text-brand-500'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                    )
                  }
                >
                  <Icon className="size-5" aria-hidden />
                  {to === '/chats' && <Badge count={unreadChats} />}
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
