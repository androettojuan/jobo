import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import { useLocalityStore } from '@/features/localities/store'
import { getProfessional } from '@/features/professionals/api'
import { createRequest } from '@/features/requests/createApi'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { Professional } from '@/types/models'

export function NewRequestPage() {
  const { uid } = useParams<{ uid: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const locality = useLocalityStore((s) => s.locality)

  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preferredAt, setPreferredAt] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!uid) return
    let cancelled = false

    getProfessional(uid)
      .then((found) => {
        if (cancelled) return
        setProfessional(found)
        setCategoryId(found?.categoryIds[0] ?? '')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [uid])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!profile || !professional) return

    setError('')
    setSending(true)
    try {
      const requestId = await createRequest(profile, professional, {
        categoryId,
        title,
        description,
        preferredAt: preferredAt ? new Date(preferredAt) : null,
        locality: profile.locality ?? locality,
        photos: [],
      })
      navigate(`/solicitudes/${requestId}`, { replace: true })
    } catch {
      setError('No pudimos enviar la solicitud. Probá de nuevo.')
      setSending(false)
    }
  }

  if (loading) return <Spinner />
  if (!professional) {
    return <p className="p-6 text-center text-slate-500">Este profesional ya no está disponible.</p>
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 p-4">
      <Link to={`/profesional/${uid}`} className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden /> Volver al perfil
      </Link>

      <header>
        <h1 className="text-2xl font-bold">Pedir presupuesto</h1>
        <p className="mt-1 text-sm text-slate-500">
          Se lo enviamos a {professional.displayName}. Va a poder responderte por chat.
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="categoria"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          ¿Qué necesitás?
        </label>
        <select
          id="categoria"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
        >
          {professional.categoryIds.map((id) => (
            <option key={id} value={id}>
              {CATEGORIES_BY_ID.get(id)?.name ?? id}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Resumen"
        placeholder="Pierde la canilla de la cocina"
        required
        maxLength={80}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Contá el problema"
        placeholder="Hace una semana que gotea. Es una canilla de mesada, ya probé cambiar el cuerito."
        required
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="¿Cuándo te vendría bien? (opcional)"
        type="datetime-local"
        value={preferredAt}
        onChange={(e) => setPreferredAt(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" size="lg" loading={sending}>
        Enviar solicitud
      </Button>

      <p className="text-center text-xs text-slate-500">
        Tu teléfono se comparte recién cuando el profesional acepta.
      </p>
    </form>
  )
}
