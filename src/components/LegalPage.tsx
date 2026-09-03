import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Marco de las páginas legales: privacidad, términos y borrado de cuenta.
 *
 * Van fuera del `AppLayout` a propósito. Sus URLs tienen que poder abrirse
 * desde afuera —las piden las dos tiendas— y ahí la barra de pestañas de una
 * app que quizá la persona no instaló no significa nada.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string
  /** Cuándo se escribió esta versión. Un documento legal sin fecha no sirve. */
  updatedAt: string
  children: ReactNode
}) {
  return (
    <div className="safe-top mx-auto flex min-h-full max-w-2xl flex-col gap-4 p-6 pb-16">
      <Link to="/" className="flex items-center gap-2 text-sm text-slate-500">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a Jobo
      </Link>

      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Última actualización: {updatedAt}</p>
      </header>

      {/* `prose` no está instalado: los estilos van en los propios elementos
          para no sumar una dependencia por tres páginas de texto. */}
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 [&_a]:text-brand-600 [&_a]:underline [&_h2]:mt-2 [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-4 [&_li]:list-disc dark:[&_h2]:text-slate-100 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </div>
  )
}
