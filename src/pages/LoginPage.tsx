import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authErrorMessage, loginWithEmail } from '@/features/auth/api'
import { ProviderButtons } from '@/features/auth/components/ProviderButtons'
import { useAuth } from '@/features/auth/useAuth'

export function LoginPage() {
  const { firebaseUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authLoading && firebaseUser) return <Navigate to={from} replace />

  async function run(action: () => Promise<unknown>) {
    setError('')
    setLoading(true)
    try {
      await action()
      navigate(from, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void run(() => loginWithEmail(email, password))
  }

  return (
    <div className="safe-top mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1>
          <img src="/img/jobo-logo.svg" alt="Jobo" className="mx-auto h-12 w-auto" />
        </h1>
        <p className="mt-1 text-slate-500">Encontrá al profesional que necesitás</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" loading={loading}>
          Entrar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />o
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <ProviderButtons disabled={loading} onRun={(action) => void run(action)} />

      <p className="text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="font-medium text-brand-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
