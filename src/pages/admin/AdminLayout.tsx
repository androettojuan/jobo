import { ArrowLeft } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'

const tabs = [
  { to: '/admin', label: 'Denuncias', end: true },
  { to: '/admin/categorias', label: 'Oficios', end: false },
  { to: '/admin/profesionales', label: 'Profesionales', end: false },
  { to: '/admin/usuarios', label: 'Usuarios', end: false },
]

export function AdminLayout() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to="/perfil" className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden /> Mi perfil
      </Link>

      <h1 className="text-2xl font-bold">Administración</h1>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 hover:border-brand-500 dark:border-slate-700',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
