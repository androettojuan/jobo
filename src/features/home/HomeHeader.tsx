import { Link } from 'react-router-dom'

import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import type { User } from '@/types/models'

/** Saludo, logo y —según haya sesión— la campana o el enlace para entrar. */
export function HomeHeader({ signedIn, profile }: { signedIn: boolean; profile: User | null }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">
          {profile ? `Hola, ${profile.displayName.split(' ')[0]}` : 'Bienvenido a'}
        </p>
        <h1>
          <img src="/img/jobo-logo.svg" alt="Jobo" className="h-8 w-auto" />
        </h1>
      </div>
      {signedIn ? (
        <NotificationsBell className="shrink-0" />
      ) : (
        <Link to="/login" className="shrink-0 text-sm font-medium text-brand-600 hover:underline">
          Iniciar sesión
        </Link>
      )}
    </header>
  )
}
