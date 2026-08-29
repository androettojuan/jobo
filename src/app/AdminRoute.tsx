import { Navigate, Outlet } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'

export function AdminRoute() {
  const { firebaseUser, isAdmin, loading } = useAuth()

  if (loading) return <Spinner />
  // Esto es solo cosmético: la seguridad real está en las reglas de Firestore,
  // que exigen el custom claim `admin`.
  if (!firebaseUser || !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
