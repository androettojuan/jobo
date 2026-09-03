import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authErrorMessage, registerWithEmail } from '@/features/auth/api'
import { ProviderButtons } from '@/features/auth/components/ProviderButtons'
import { RoleChoice, type Role } from '@/features/auth/components/RoleChoice'

export function RegisterPage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('cliente')
  const [acepta, setAcepta] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setError('')
    setLoading(true)
    try {
      await action()
      // Quien viene a ofrecer servicios entra directo a completar su perfil:
      // sin oficios ni zona no aparece en ninguna búsqueda, así que mandarlo a
      // la home sería dejarlo registrado y a la vez invisible.
      navigate(role === 'profesional' ? '/perfil/profesional?alta=1' : '/', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void run(() => registerWithEmail({ displayName, email, password }))
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* El contenedor que scrollea y el que centra tienen que ser distintos:
          con `justify-center` sobre el que scrollea, en una pantalla corta el
          contenido que se pasa por arriba queda inalcanzable. Con `min-h-full`
          adentro, el centrado solo actúa mientras sobra lugar. */}
      <div className="safe-top mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
        <header>
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Con una sola cuenta podés contratar y, si querés, ofrecer tus servicios.
          </p>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <RoleChoice value={role} onChange={setRole} />

          <Input
            label="Nombre y apellido"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Apple (guía 1.2) exige aceptar los términos antes de poder
            publicar contenido, y en Jobo se publica desde el minuto uno:
            un perfil, una solicitud, un mensaje. */}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-brand-600"
            />
            <span className="text-slate-600 dark:text-slate-400">
              Acepto los{' '}
              <Link to="/terminos" className="text-brand-600 underline">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="text-brand-600 underline">
                política de privacidad
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" loading={loading}>
            Crear cuenta
          </Button>
        </form>

        {/* Los proveedores no pasan por el `required` del formulario, así que
          el checkbox se chequea a mano antes de dejar entrar. */}
        <ProviderButtons disabled={loading || !acepta} onRun={(action) => void run(action)} />
        {!acepta && (
          <p className="-mt-4 text-center text-xs text-slate-400">
            Para continuar, aceptá los términos.
          </p>
        )}

        <p className="text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
