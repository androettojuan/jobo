import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { PhotoPicker } from '@/components/PhotoPicker'
import { Button } from '@/components/ui/Button'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { Input } from '@/components/ui/Input'
import { FormSkeleton } from '@/components/ui/skeletons'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import {
  getMyProfessional,
  proposeCategory,
  saveProfessional,
  type ProfessionalDraft,
} from '@/features/professionals/profileApi'
import { CATEGORIES } from '@/lib/categories'
import { LocalitySelect } from '@/features/localities/LocalitySelect'
import { ServiceAreaPicker } from '@/features/localities/ServiceAreaPicker'
import { toLocalityRef } from '@/lib/localities'

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
  // `?alta=1` lo pone el registro de quien eligió ofrecer servicios: la misma
  // pantalla, pero explicando por qué está acá y sin un "volver" que lo mande
  // a un perfil que todavía no miró.
  const [params] = useSearchParams()
  const esAlta = params.get('alta') === '1'

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
    // Forma funcional: dos toggles seguidos no se pisan entre sí.
    setDraft((prev) => {
      const current = prev[key]
      return {
        ...prev,
        [key]: current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
      }
    })
    setSaved(false)
  }

  async function addProposedCategory() {
    if (!firebaseUser || newCategory.trim().length < 3) return
    try {
      const id = await proposeCategory(firebaseUser.uid, newCategory)
      setProposed((prev) => [...prev, { id, name: newCategory.trim() }])
      setDraft((prev) => ({ ...prev, categoryIds: [...prev.categoryIds, id] }))
      setNewCategory('')
    } catch {
      setError('No pudimos registrar ese oficio. Probá con otro nombre.')
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
        {
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          publicPhone: profile.phoneIsPublic ? profile.phone : null,
        },
        draft,
      )
      // Al terminar el alta se va al panel: es donde va a ver las solicitudes
      // que empiecen a llegar, y dejarlo en el formulario que acaba de
      // completar no le dice que ya está listo.
      if (esAlta) {
        navigate('/mi-trabajo', { replace: true })
        return
      }
      setSaved(true)
    } catch {
      setError('No pudimos guardar los cambios. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <FormSkeleton fields={6} />

  const categoryOptions = [
    ...CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
    ...proposed.map((c) => ({ id: c.id, name: `${c.name} (a revisar)` })),
  ]

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 p-4">
      {!esAlta && (
        <Link to="/perfil" className="flex items-center gap-1 text-sm text-slate-500">
          <ArrowLeft className="size-4" aria-hidden /> Mi perfil
        </Link>
      )}

      <header>
        <h1 className="text-2xl font-bold">
          {esAlta ? 'Contanos qué hacés' : 'Mi perfil profesional'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {esAlta
            ? 'Un último paso: hasta que completes esto no aparecés en las búsquedas. Podés cambiarlo cuando quieras.'
            : 'Así te van a ver las personas que buscan un profesional en tu zona.'}
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

      <LocalitySelect
        label="Localidad donde vivís"
        value={draft.locality?.id ?? null}
        onChange={(found) => patch({ locality: found ? toLocalityRef(found) : null })}
      />

      <ServiceAreaPicker
        selected={draft.serviceAreaIds}
        onToggle={(id) => toggle('serviceAreaIds', id)}
        exclude={draft.locality?.id ?? null}
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

      <PhotoPicker
        label="Fotos de trabajos"
        hint="Mostrá lo que hacés: es lo primero que mira quien te va a contratar."
        photos={draft.photos}
        onChange={(photos) => patch({ photos })}
        buildPath={(file) =>
          `users/${firebaseUser?.uid}/work/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
        }
      />

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
