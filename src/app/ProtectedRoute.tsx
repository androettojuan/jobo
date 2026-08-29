import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'

export function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!firebaseUser) {
    // Guardamos a dónde iba para volver ahí después del login.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
