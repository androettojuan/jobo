import { LocateFixed, MapPin } from 'lucide-react'
import { useState } from 'react'

import { detectLocality, LOCALITIES, toLocalityRef } from '@/lib/localities'

import { useLocalityStore } from './store'

/** Selector de pueblo/ciudad: se puede detectar o elegir a mano. */
export function LocalityPicker() {
  const { locality, setLocality } = useLocalityStore()
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')

  async function detect() {
    setError('')
    setDetecting(true)
    try {
      const found = await detectLocality()
      if (found) setLocality(toLocalityRef(found))
      else setError('No encontramos tu localidad en la lista. Elegila a mano.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos detectar tu ubicación.')
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden />
        <select
          aria-label="Localidad"
          value={locality?.id ?? ''}
          onChange={(e) => {
            const found = LOCALITIES.find((l) => l.id === e.target.value)
            setLocality(found ? toLocalityRef(found) : null)
          }}
          className="min-w-0 flex-1 truncate bg-transparent py-1 text-sm font-medium focus:outline-none"
        >
          <option value="">Todas las localidades</option>
          {LOCALITIES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void detect()}
          disabled={detecting}
          className="flex shrink-0 items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-xs disabled:opacity-50 dark:border-slate-700"
        >
          <LocateFixed className="size-3.5" aria-hidden />
          {detecting ? 'Buscando…' : 'Detectar'}
        </button>
      </div>
      {error && <p className="text-xs text-amber-600">{error}</p>}
    </div>
  )
}
