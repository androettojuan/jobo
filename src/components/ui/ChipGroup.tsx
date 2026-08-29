import { cn } from '@/lib/utils'

export interface ChipOption {
  id: string
  name: string
}

interface ChipGroupProps {
  label: string
  hint?: string
  options: ChipOption[]
  selected: string[]
  onToggle: (id: string) => void
  /** Máximo de opciones seleccionables; al llegar, el resto se deshabilita. */
  max?: number
}

/** Selección múltiple con chips: más cómoda que un <select multiple> en el celular. */
export function ChipGroup({ label, hint, options, selected, onToggle, max }: ChipGroupProps) {
  const full = max !== undefined && selected.length >= max

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id)
          const disabled = full && !active

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onToggle(option.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 hover:border-brand-500 dark:border-slate-700',
                disabled && 'opacity-40',
              )}
            >
              {option.name}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
