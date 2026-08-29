import { ArrowLeft, Plus, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import {
  getMyProfessional,
  proposeCategory,
  saveProfessional,
  uploadWorkPhoto,
  type ProfessionalDraft,
} from '@/features/professionals/profileApi'
import { CATEGORIES } from '@/lib/categories'
import { LOCALITIES, toLocalityRef } from '@/lib/localities'
import type { ProfessionalStatus } from '@/types/models'

const MAX_CATEGORIES = 5

const EMPTY: ProfessionalDraft = {
  headline: '',
  description: '',
  categoryIds: [],
  locality: null,
  serviceAreaIds: [],
  hourlyRateFrom: null,
  hourlyRateTo: null,
  photos: [],
  status: 'active',
}

export function ProfessionalEditPage() {
  const { firebaseUser, profile } = useAuth()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<ProfessionalDraft>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [proposed, setProposed] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!firebaseUser) return
    let cancelled = false

    getMyProfessional(firebaseUser.uid)
      .then((existing) => {
        if (cancelled || !existing) return
        setDraft({
          headline: existing.headline,
          description: existing.description,
          categoryIds: existing.categoryIds,
          locality: existing.locality,
          serviceAreaIds: existing.serviceAreaIds,
          hourlyRateFrom: existing.hourlyRateFrom,
          hourlyRateTo: existing.hourlyRateTo,
          photos: existing.photos ?? [],
          status: existing.status,
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [firebaseUser])

  function patch(changes: Partial<ProfessionalDraft>) {
    setDraft((prev) => ({ ...prev, ...changes }))
    setSaved(false)
  }

  function toggle(key: 'categoryIds' | 'serviceAreaIds', id: string) {
    const current = draft[key]
    patch({
      [key]: current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    })
  }

  async function addProposedCategory() {
    if (!firebaseUser || newCategory.trim().length < 3) return
    try {
      const id = await proposeCategory(firebaseUser.uid, newCategory)
      setProposed((prev) => [...prev, { id, name: newCategory.trim() }])
      patch({ categoryIds: [...draft.categoryIds, id] })
      setNewCategory('')
    } catch {
      setError('No pudimos registrar ese oficio. Probá con otro nombre.')
    }
  }

  async function onPhoto(file: File) {
    if (!firebaseUser) return
    try {
      const url = await uploadWorkPhoto(firebaseUser.uid, file)
      patch({ photos: [...draft.photos, url] })
    } catch {
      setError('No pudimos subir la foto. Probá con una más liviana.')
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!firebaseUser || !profile) return

    if (draft.categoryIds.length === 0) {
      setError('Elegí al menos un oficio.')
      return
    }
    if (!draft.locality) {
      setError('Elegí la localidad donde trabajás.')
      return
    }
    if (
      draft.hourlyRateFrom !== null &&
      draft.hourlyRateTo !== null &&
      draft.hourlyRateFrom > draft.hourlyRateTo
    ) {
      setError('El precio mínimo no puede ser mayor al máximo.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await saveProfessional(
        firebaseUser.uid,
        { displayName: profile.displayName, photoURL: profile.photoURL },
        draft,
      )
      setSaved(true)
    } catch {
      setError('No pudimos guardar los cambios. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const categoryOptions = [
    ...CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
    ...proposed.map((c) => ({ id: c.id, name: `${c.name} (a revisar)` })),
  ]

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 p-4">
      <Link to="/perfil" className="flex items-center gap-1 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden /> Mi perfil
      </Link>

      <header>
        <h1 className="text-2xl font-bold">Mi perfil profesional</h1>
        <p className="mt-1 text-sm text-slate-500">
          Así te van a ver las personas que buscan un profesional en tu zona.
        </p>
      </header>

      <Input
        label="Título"
        placeholder="Plomero matriculado · 10 años de experiencia"
        maxLength={80}
        value={draft.headline}
        onChange={(e) => patch({ headline: e.target.value })}
      />

      <Textarea
        label="Sobre mí"
        placeholder="Contá qué trabajos hacés, tus horarios, si tenés herramientas propias…"
        maxLength={1000}
        value={draft.description}
        onChange={(e) => patch({ description: e.target.value })}
        hint={`${draft.description.length}/1000`}
      />

      <ChipGroup
        label="Oficios"
        hint={`Elegí hasta ${MAX_CATEGORIES}.`}
        options={categoryOptions}
        selected={draft.categoryIds}
        onToggle={(id) => toggle('categoryIds', id)}
        max={MAX_CATEGORIES}
      />

      <div className="flex items-end gap-2">
        <Input
          label="¿Tu oficio no está en la lista?"
          placeholder="Escribilo y lo revisamos"
          maxLength={40}
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void addProposedCategory()}
          disabled={newCategory.trim().length < 3}
        >
          <Plus className="size-4" aria-hidden />
          Proponer
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="locality"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Localidad donde vivís
        </label>
        <select
          id="locality"
          value={draft.locality?.id ?? ''}
          onChange={(e) => {
            const found = LOCALITIES.find((l) => l.id === e.target.value)
            patch({ locality: found ? toLocalityRef(found) : null })
          }}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Elegí tu localidad</option>
          {LOCALITIES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <ChipGroup
        label="¿A qué otras localidades vas?"
        hint="Tu localidad ya está incluida. Marcá las demás donde estés dispuesto a trabajar."
        options={LOCALITIES.filter((l) => l.id !== draft.locality?.id).map((l) => ({
          id: l.id,
          name: l.name,
        }))}
        selected={draft.serviceAreaIds}
        onToggle={(id) => toggle('serviceAreaIds', id)}
      />

      <fieldset className="flex gap-3">
        <Input
          label="Precio por hora desde"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="A convenir"
          value={draft.hourlyRateFrom ?? ''}
          onChange={(e) =>
            patch({ hourlyRateFrom: e.target.value ? Number(e.target.value) : null })
          }
        />
        <Input
          label="Hasta"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="A convenir"
          value={draft.hourlyRateTo ?? ''}
          onChange={(e) => patch({ hourlyRateTo: e.target.value ? Number(e.target.value) : null })}
        />
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Fotos de trabajos
        </span>
        <ul className="flex flex-wrap gap-2">
          {draft.photos.map((url) => (
            <li key={url} className="relative">
              <img src={url} alt="" className="size-20 rounded-xl object-cover" />
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() => patch({ photos: draft.photos.filter((p) => p !== url) })}
                className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-slate-900 text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <label className="grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-700">
              <Plus className="size-5" aria-hidden />
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onPhoto(file)
                  e.target.value = ''
                }}
              />
            </label>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Estado
        </label>
        <select
          id="status"
          value={draft.status}
          onChange={(e) => patch({ status: e.target.value as ProfessionalStatus })}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="active">Disponible: aparezco en las búsquedas</option>
          <option value="paused">En pausa: no aparezco por ahora</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Perfil guardado.</p>}

      <div className="flex gap-2">
        <Button type="submit" size="lg" loading={saving} className="flex-1">
          Guardar
        </Button>
        {firebaseUser && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate(`/profesional/${firebaseUser.uid}`)}
          >
            Ver perfil
          </Button>
        )}
      </div>
    </form>
  )
}
