import { Briefcase, Camera, LogOut, Shield } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormSkeleton } from '@/components/ui/skeletons'
import { logout } from '@/features/auth/api'
import { updateUserProfile, uploadAvatar } from '@/features/auth/profileApi'
import { useAuth } from '@/features/auth/useAuth'
import { LOCALITIES, toLocalityRef } from '@/lib/localities'
import type { LocalityRef } from '@/types/models'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'

export function ProfilePage() {
  const { firebaseUser, profile, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneIsPublic, setPhoneIsPublic] = useState(false)
  const [locality, setLocality] = useState<LocalityRef | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName)
    setPhone(profile.phone ?? '')
    setPhoneIsPublic(profile.phoneIsPublic)
    setLocality(profile.locality)
  }, [profile])

  if (loading) return <FormSkeleton fields={5} />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!firebaseUser) return

    setError('')
    setSaving(true)
    try {
      await updateUserProfile(firebaseUser.uid, {
        displayName,
        phone: phone || null,
        phoneIsPublic,
        locality,
      })
      setSaved(true)
    } catch {
      setError('No pudimos guardar tus datos.')
    } finally {
      setSaving(false)
    }
  }

  async function onAvatar(file: File) {
    if (!firebaseUser) return
    try {
      await uploadAvatar(firebaseUser.uid, file)
    } catch {
      setError('No pudimos subir la foto.')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <NotificationsBell />
      </div>

      <div className="flex items-center gap-3">
        <label className="relative cursor-pointer">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500 dark:bg-slate-800">
              {profile?.displayName?.charAt(0) ?? '?'}
            </div>
          )}
          <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-brand-600 text-white">
            <Camera className="size-3.5" aria-hidden />
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onAvatar(file)
              e.target.value = ''
            }}
          />
        </label>
        <div className="min-w-0">
          <p className="truncate font-medium">{profile?.displayName}</p>
          <p className="truncate text-sm text-slate-500">{profile?.email}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre y apellido"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <Input
          label="Teléfono"
          type="tel"
          inputMode="tel"
          placeholder="3546 55-1234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={phoneIsPublic}
            onChange={(e) => setPhoneIsPublic(e.target.checked)}
            className="mt-0.5 size-4"
          />
          <span>
            Mostrar mi teléfono en mi perfil.
            <span className="block text-xs text-slate-500">
              Si lo dejás sin marcar, solo lo ve quien tenga una solicitud aceptada con vos.
            </span>
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="mi-localidad"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Mi localidad
          </label>
          <select
            id="mi-localidad"
            value={locality?.id ?? ''}
            onChange={(e) => {
              const found = LOCALITIES.find((l) => l.id === e.target.value)
              setLocality(found ? toLocalityRef(found) : null)
            }}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Sin especificar</option>
            {LOCALITIES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Datos guardados.</p>}

        <Button type="submit" loading={saving}>
          Guardar cambios
        </Button>
      </form>

      <nav className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        <Link
          to={profile?.isProfessional ? '/mi-trabajo' : '/perfil/profesional'}
          className="flex items-center gap-3 py-3"
        >
          <Briefcase className="size-5 text-slate-400" aria-hidden />
          {profile?.isProfessional ? 'Mi panel de trabajo' : 'Quiero ofrecer mis servicios'}
        </Link>
        {isAdmin && (
          <Link to="/admin" className="flex items-center gap-3 py-3">
            <Shield className="size-5 text-slate-400" aria-hidden />
            Panel de administración
          </Link>
        )}
      </nav>

      <Button
        variant="secondary"
        onClick={async () => {
          await logout()
          navigate('/', { replace: true })
        }}
      >
        <LogOut className="size-4" aria-hidden />
        Cerrar sesión
      </Button>
    </div>
  )
}
