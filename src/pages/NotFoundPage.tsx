import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 p-10 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="text-slate-500">El enlace que seguiste no existe o cambió.</p>
      <Link to="/" className="font-medium text-brand-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
