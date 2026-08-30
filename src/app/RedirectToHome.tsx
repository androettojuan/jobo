import { Navigate, useLocation } from 'react-router-dom'

/** Manda a la home conservando la query (`?categoria=`, por ejemplo). */
export function RedirectToHome() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/', search }} replace />
}
