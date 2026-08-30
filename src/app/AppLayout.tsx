import { ClipboardList, Home, MessageCircle, User } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/useAuth'
import { useUnreadChats } from '@/features/chat/useUnreadChats'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import { InstallPrompt } from '@/features/pwa/InstallPrompt'
import { UpdatePrompt } from '@/features/pwa/UpdatePrompt'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
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
  const { pathname } = useLocation()

  // El chat ocupa toda la pantalla: barra y encabezado estorban.
  const immersive = /^\/chats\/[^/]+$/.test(pathname)
  // La home la pone en su propio encabezado, a la altura del logo; en la
  // pantalla de avisos no tiene sentido llevar a donde ya estás.
  const hideBell = pathname === '/' || pathname === '/notificaciones'

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <main
        className={cn(
          'relative flex-1 overflow-y-auto',
          immersive ? 'h-full' : 'safe-top pb-20',
        )}
      >
        {!immersive && firebaseUser && !hideBell && (
          <NotificationsBell className="absolute top-4 right-4 z-10" />
        )}
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
