import { LocateFixed } from 'lucide-react'
import { useState } from 'react'

import { detectLocality, toLocalityRef } from '@/lib/localities'

import { LocalitySelect } from './LocalitySelect'
import { useLocalityStore } from './store'

/** Selector de pueblo/ciudad: se puede detectar o buscar a mano. */
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
      else setError('No encontramos ninguna localidad cerca. Buscala a mano.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos detectar tu ubicación.')
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <LocalitySelect
          className="min-w-0 flex-1"
          value={locality?.id ?? null}
          onChange={(found) => setLocality(found ? toLocalityRef(found) : null)}
          placeholder="Todas las localidades"
          clearable
        />
        <button
          type="button"
          onClick={() => void detect()}
          disabled={detecting}
          className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-slate-300 px-3 text-xs disabled:opacity-50 dark:border-slate-700"
        >
          <LocateFixed className="size-3.5" aria-hidden />
          {detecting ? 'Buscando…' : 'Detectar'}
        </button>
      </div>
      {error && <p className="text-xs text-amber-600">{error}</p>}
    </div>
  )
}
