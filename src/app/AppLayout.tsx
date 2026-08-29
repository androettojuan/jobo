import { Home, MessageCircle, Search, ClipboardList, User } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/buscar', label: 'Buscar', icon: Search, end: false },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, end: false },
  { to: '/chats', label: 'Chats', icon: MessageCircle, end: false },
  { to: '/perfil', label: 'Perfil', icon: User, end: false },
]

export function AppLayout() {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <main className="safe-top flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <ul className="flex">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2 text-[11px] transition-colors',
                    isActive
                      ? 'text-brand-600 dark:text-brand-500'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
