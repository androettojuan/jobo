import { useLocalities } from './useLocalities'

/**
 * Las zonas de un profesional, que se guardan como ids. Es su propio
 * componente para que el catálogo se baje solo cuando hay zonas que mostrar,
 * y no en cada ficha que se abre.
 */
export function ServiceAreas({ ids }: { ids: string[] }) {
  const { localities } = useLocalities()
  const names = new Map(localities.map((l) => [l.id, l.name]))

  return (
    <section>
      <h2 className="mb-1 font-semibold">Zonas donde trabaja</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {ids.map((id) => names.get(id) ?? id).join(' · ')}
      </p>
    </section>
  )
}
