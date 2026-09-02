import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    // El ref guardado ya trae nombre y provincia, así que no hace falta el
    // catálogo para volver a pintarlo al abrir la app.
    { name: 'jobo:locality' },
  ),
)
