import { Briefcase, ClipboardList, Home, MessageCircle, User } from 'lucide-react'
import { useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { readProfessionalHint } from '@/features/auth/sessionHints'
import { useAuth } from '@/features/auth/useAuth'
import { useUnreadChats } from '@/features/chat/useUnreadChats'
import { ForegroundToast } from '@/features/notifications/ForegroundToast'
import { InstallPrompt } from '@/features/pwa/InstallPrompt'
import { UpdatePrompt } from '@/features/pwa/UpdatePrompt'
import { isNative } from '@/lib/platform'
import { cn } from '@/lib/utils'

const BASE_TABS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, end: false },
  { to: '/chats', label: 'Chats', icon: MessageCircle, end: false },
  { to: '/perfil', label: 'Perfil', icon: User, end: false },
]

/** La pestaña de trabajo solo le sirve a quien ofrece servicios. */
const WORK_TAB = { to: '/mi-trabajo', label: 'Mi trabajo', icon: Briefcase, end: false }

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="absolute top-0 right-1/4 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] leading-4 font-medium text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function AppLayout() {
  const { profile, loading } = useAuth()
  const unreadChats = useUnreadChats()
  const { pathname } = useLocation()

  // El chat ocupa toda la pantalla: barra y encabezado estorban.
  const immersive = /^\/chats\/[^/]+$/.test(pathname)

  // Mientras el perfil viaja desde Firestore, la barra se guía por lo que pasó
  // la última vez en este teléfono: así no se dibuja con cuatro pestañas para
  // agregar una quinta a los pocos milisegundos.
  const hint = useMemo(() => readProfessionalHint(), [])
  const isProfessional = loading ? hint : Boolean(profile?.isProfessional)

  const tabs = isProfessional
    ? [...BASE_TABS.slice(0, 2), WORK_TAB, ...BASE_TABS.slice(2)]
    : BASE_TABS

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      {/* Tapa el hueco de la barra de estado: el contenido scrollea por
          debajo y sin esto se lee encima de la hora y la batería. */}
      <div aria-hidden className="status-scrim fixed inset-x-0 top-0 z-40" />

      <main className={cn('flex-1 overflow-y-auto', immersive ? 'h-full' : 'safe-top pb-nav')}>
        {!immersive && !isNative && <InstallPrompt />}
        <Outlet />
      </main>

      <ForegroundToast />
      {/* Adentro del contenedor nativo no hay nada que instalar ni que
          actualizar a mano: de eso se encarga la tienda. */}
      {!isNative && <UpdatePrompt />}

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
