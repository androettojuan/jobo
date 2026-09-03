import { Ban, Undo2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'

import { blockUser, unblockUser } from '../api'
import { useBlocked } from '../useBlocked'

interface BlockButtonProps {
  /** A quién. El nombre y la foto se copian para la lista de bloqueados. */
  target: { uid: string; displayName: string; photoURL: string | null }
}

/** Bloquear o desbloquear a alguien, con confirmación en el primer sentido. */
export function BlockButton({ target }: BlockButtonProps) {
  const { firebaseUser } = useAuth()
  const blocked = useBlocked()
  const [confirmando, setConfirmando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')

  // Bloquearse a uno mismo no significa nada, y sin cuenta no hay a quién
  // guardarle el bloqueo.
  if (!firebaseUser || firebaseUser.uid === target.uid) return null

  const estaBloqueado = blocked.has(target.uid)

  async function alternar() {
    if (!firebaseUser) return
    setError('')
    setTrabajando(true)
    try {
      if (estaBloqueado) await unblockUser(firebaseUser.uid, target.uid)
      else await blockUser(firebaseUser.uid, target)
      setConfirmando(false)
    } catch {
      setError('No pudimos hacerlo. Probá de nuevo.')
    } finally {
      setTrabajando(false)
    }
  }

  if (estaBloqueado) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500">
          Bloqueaste a esta persona: no pueden escribirse ni pedirse presupuestos.
        </p>
        <Button variant="secondary" loading={trabajando} onClick={() => void alternar()}>
          <Undo2 className="size-4" aria-hidden />
          Desbloquear
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="flex items-center gap-2 py-3 text-sm text-slate-500"
      >
        <Ban className="size-4" aria-hidden />
        Bloquear a esta persona
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-sm text-slate-500">
        No van a poder escribirse ni pedirse presupuestos. Los mensajes que ya se mandaron quedan.
        Podés desbloquear cuando quieras.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="danger" size="sm" loading={trabajando} onClick={() => void alternar()}>
          Bloquear
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={trabajando}
          onClick={() => setConfirmando(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
