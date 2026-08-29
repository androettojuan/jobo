import { Briefcase, LogOut, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { logout } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'

export function ProfilePage() {
  const { profile, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <div className="flex items-center gap-3">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500 dark:bg-slate-800">
            {profile?.displayName?.charAt(0) ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{profile?.displayName}</p>
          <p className="truncate text-sm text-slate-500">{profile?.email}</p>
        </div>
      </div>

      <nav className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        <Link to="/buscar" className="flex items-center gap-3 py-3">
          <Briefcase className="size-5 text-slate-400" aria-hidden />
          {profile?.isProfessional ? 'Mi perfil profesional' : 'Quiero ofrecer mis servicios'}
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
