import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

/**
 * Pantalla de último recurso: si una ruta revienta al renderizar, React Router
 * muestra esto en vez de su cartel genérico en inglés con el stack a la vista.
 */
export function RouteError() {
  const error = useRouteError()

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null

  return (
    <div className="flex flex-col items-center gap-4 p-10 text-center">
      <h1 className="text-2xl font-bold">Algo se rompió</h1>
      <p className="text-slate-500">
        No pudimos mostrar esta pantalla. Probá de nuevo; si sigue igual, volvé al inicio.
      </p>
      {detail && <p className="text-xs text-slate-400">{detail}</p>}
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
        <Link to="/" className="self-center font-medium text-brand-600 hover:underline">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
