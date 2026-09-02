import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authErrorMessage, registerWithEmail } from '@/features/auth/api'
import { ProviderButtons } from '@/features/auth/components/ProviderButtons'

export function RegisterPage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setError('')
    setLoading(true)
    try {
      await action()
      navigate('/', { replace: true })
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
    <div className="safe-top mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Con una sola cuenta podés contratar y, si querés, ofrecer tus servicios.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <ProviderButtons disabled={loading} onRun={(action) => void run(action)} />

      <p className="text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
