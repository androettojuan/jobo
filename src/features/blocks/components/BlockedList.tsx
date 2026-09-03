import { Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import type { Block } from '@/types/models'

import { subscribeToBlocked, unblockUser } from '../api'

/**
 * Las personas que bloqueaste, con su botón para deshacerlo.
 *
 * Poder bloquear sin poder desbloquear sería una trampa, y las tiendas piden
 * las dos mitades. Si no bloqueaste a nadie no se dibuja nada: es una sección
 * que la mayoría no va a usar nunca.
 */
export function BlockedList() {
  const { firebaseUser } = useAuth()
  const [blocked, setBlocked] = useState<Block[]>([])
  const [trabajando, setTrabajando] = useState('')

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToBlocked(firebaseUser.uid, setBlocked, () => setBlocked([]))
  }, [firebaseUser])

  if (blocked.length === 0) return null

  async function desbloquear(uid: string) {
    if (!firebaseUser) return
    setTrabajando(uid)
    try {
      await unblockUser(firebaseUser.uid, uid)
    } finally {
      setTrabajando('')
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Personas bloqueadas
      </h2>
      <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        {blocked.map((persona) => (
          <li key={persona.uid} className="flex items-center gap-3 py-2">
            {persona.photoURL ? (
              <img src={persona.photoURL} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <div className="grid size-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500 dark:bg-slate-800">
                {persona.displayName.charAt(0)}
              </div>
            )}
            <span className="min-w-0 flex-1 truncate text-sm">{persona.displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              loading={trabajando === persona.uid}
              onClick={() => void desbloquear(persona.uid)}
            >
              <Undo2 className="size-4" aria-hidden />
              Desbloquear
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
