import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { searchLocalities } from '@/lib/localities'
import { cn } from '@/lib/utils'
import type { Locality } from '@/types/models'

import { useLocalities } from './useLocalities'

interface LocalitySelectProps {
  value: string | null
  onChange: (locality: Locality | null) => void
  label?: string
  /** Texto cuando no hay nada elegido; también la opción para limpiar. */
  placeholder?: string
  /** Muestra la opción que deja el filtro sin localidad. */
  clearable?: boolean
  className?: string
}

/**
 * Elegir localidad entre las cuatro mil del país. Un <select> nativo no sirve
 * acá por dos motivos: la lista es impracticable a dedo, y en modo oscuro el
 * navegador pinta el desplegable con su propio fondo claro y el texto queda
 * ilegible. Este se busca escribiendo y se pinta con los colores de la app.
 */
export function LocalitySelect({
  value,
  onChange,
  label,
  placeholder = 'Elegí tu localidad',
  clearable = false,
  className,
}: LocalitySelectProps) {
  const { localities, loading } = useLocalities()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => (value ? localities.find((l) => l.id === value) : undefined),
    [localities, value],
  )
  const results = useMemo(() => searchLocalities(localities, term), [localities, term])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setTerm('')
  }, [open])

  // Un clic afuera cierra la lista; si no, queda abierta tapando la pantalla.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function pick(locality: Locality | null) {
    onChange(locality)
    setOpen(false)
  }

  return (
    <div ref={boxRef} className={cn('relative flex flex-col gap-1', className)}>
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-300 px-3 text-left text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-slate-400')}>
          {selected ? selected.name : placeholder}
        </span>
        {selected && <span className="shrink-0 text-xs text-slate-400">{selected.province}</span>}
        <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
      </button>

      {open && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-700">
            <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscá tu pueblo o ciudad"
              aria-label="Buscar localidad"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm('')}
                aria-label="Limpiar la búsqueda"
                className="shrink-0 text-slate-400"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto">
            {clearable && (
              <li>
                <button
                  type="button"
                  onClick={() => pick(null)}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {placeholder}
                </button>
              </li>
            )}

            {loading && <li className="px-3 py-3 text-sm text-slate-400">Cargando localidades…</li>}

            {!loading && results.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-400">
                No encontramos ninguna localidad con ese nombre.
              </li>
            )}

            {results.map((locality) => (
              <li key={locality.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={locality.id === value}
                  onClick={() => pick(locality)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="min-w-0 flex-1 truncate">{locality.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{locality.province}</span>
                  {locality.id === value && (
                    <Check className="size-4 shrink-0 text-brand-600" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
