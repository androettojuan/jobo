import { Search, X } from 'lucide-react'

/** Campo de búsqueda de la home, con la lupa y el botón de limpiar. */
export function SearchField({
  term,
  onChange,
}: {
  term: string
  onChange: (term: string) => void
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={term}
        onChange={(e) => onChange(e.target.value)}
        placeholder="¿Qué necesitás resolver?"
        aria-label="Buscar profesionales"
        className="h-12 w-full rounded-xl border border-slate-300 pr-11 pl-11 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 [&::-webkit-search-cancel-button]:hidden"
      />
      {term && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar la búsqueda"
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </div>
  )
}
