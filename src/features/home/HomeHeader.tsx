import { Link } from 'react-router-dom'

import { readSignedInHint } from '@/features/auth/sessionHints'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'
import type { User } from '@/types/models'

/**
 * Saludo, logo y —según haya sesión— la campana o el enlace para entrar.
 *
 * Mientras Firebase todavía no contestó, se muestra lo que había la última vez
 * en este teléfono. Sin eso, quien tiene sesión ve "Iniciar sesión" durante un
 * instante en cada arranque, y después salta a la campana.
 */
export function HomeHeader({
  signedIn,
  loading,
  profile,
}: {
  signedIn: boolean
  loading: boolean
  profile: User | null
}) {
  const muestraCampana = loading ? readSignedInHint() : signedIn

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
      {muestraCampana ? (
        <NotificationsBell className="shrink-0" />
      ) : (
        <Link to="/login" className="shrink-0 text-sm font-medium text-brand-600 hover:underline">
          Iniciar sesión
        </Link>
      )}
    </header>
  )
}
