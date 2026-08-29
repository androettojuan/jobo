import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LOCALITIES_BY_ID } from '@/lib/localities'
import type { LocalityRef } from '@/types/models'

interface LocalityState {
  /** Localidad elegida para filtrar búsquedas. null = todas. */
  locality: LocalityRef | null
  setLocality: (locality: LocalityRef | null) => void
}

/** Se persiste en localStorage: al volver a abrir la app sigue tu pueblo elegido. */
export const useLocalityStore = create<LocalityState>()(
  persist(
    (set) => ({
      locality: null,
      setLocality: (locality) => set({ locality }),
    }),
    {
      name: 'jobo:locality',
      // Si una localidad sale del catálogo, no la arrastramos.
      merge: (persisted, current) => {
        const saved = (persisted as LocalityState | undefined)?.locality
        return {
          ...current,
          locality: saved && LOCALITIES_BY_ID.has(saved.id) ? saved : null,
        }
      },
    },
  ),
)
