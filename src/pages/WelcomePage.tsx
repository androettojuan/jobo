import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { RoleChoice, type Role } from '@/features/auth/components/RoleChoice'
import { useAuth } from '@/features/auth/useAuth'

/**
 * La pregunta del registro, para quien no pasó por el registro.
 *
 * Con Google y con Apple, "entrar" y "crear cuenta" son el mismo botón, y está
 * también en la pantalla de login: alguien que llega por ahí se crea la cuenta
 * sin que nadie le pregunte nunca a qué vino, y si era un profesional queda
 * registrado y a la vez invisible.
 *
 * Solo la ve quien acaba de crear la cuenta, una vez.
 */
export function WelcomePage() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('cliente')

  // Quien ya activó su perfil profesional no tiene nada que contestar acá.
  if (!loading && profile?.isProfessional) return <Navigate to="/mi-trabajo" replace />

  return (
    <div className="h-full overflow-y-auto">
      <div className="safe-top mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
        <header>
          <h1 className="text-2xl font-bold">
            {profile ? `Hola, ${profile.displayName.split(' ')[0]}` : 'Bienvenido a Jobo'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Una sola pregunta y arrancamos. Después podés cambiar de idea cuando quieras.
          </p>
        </header>

        <RoleChoice value={role} onChange={setRole} />

        <Button
          size="lg"
          onClick={() =>
            navigate(role === 'profesional' ? '/perfil/profesional?alta=1' : '/', {
              replace: true,
            })
          }
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
