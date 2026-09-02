import { X } from 'lucide-react'

import { LocalitySelect } from './LocalitySelect'
import { useLocalities } from './useLocalities'

/**
 * Las localidades a las que el profesional está dispuesto a ir. Antes eran
 * chips con el catálogo entero; con las cuatro mil del país hay que buscarlas
 * y quedan listadas solo las elegidas.
 */
export function ServiceAreaPicker({
  selected,
  onToggle,
  /** La localidad propia ya está incluida: no tiene sentido volver a elegirla. */
  exclude,
}: {
  selected: string[]
  onToggle: (id: string) => void
  exclude?: string | null
}) {
  const { localities } = useLocalities()
  const byId = new Map(localities.map((l) => [l.id, l]))

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
        ¿A qué otras localidades vas?
      </legend>
      <p className="text-xs text-slate-500">
        Tu localidad ya está incluida. Agregá las demás donde estés dispuesto a trabajar.
      </p>

      <LocalitySelect
        value={null}
        onChange={(locality) => {
          if (locality && locality.id !== exclude && !selected.includes(locality.id)) {
            onToggle(locality.id)
          }
        }}
        placeholder="Agregar una localidad"
      />

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onToggle(id)}
                className="flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm text-white"
              >
                {byId.get(id)?.name ?? id}
                <X className="size-4" aria-hidden />
                <span className="sr-only">Quitar</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
