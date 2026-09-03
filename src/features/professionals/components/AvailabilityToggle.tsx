import { Palmtree, Zap } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { setProfessionalStatus } from '@/features/professionals/profileApi'
import { cn } from '@/lib/utils'
import type { ProfessionalStatus } from '@/types/models'

/**
 * Disponible o en pausa, de un toque y desde el panel.
 *
 * Antes esto vivía en un `<select>` al final del formulario de edición, que
 * además había que guardar entero. Es lo que más se cambia de un perfil —te
 * vas unos días, tenés la agenda llena— y estaba en el lugar más incómodo.
 */
export function AvailabilityToggle({
  uid,
  status,
  onChange,
}: {
  uid: string
  status: ProfessionalStatus
  onChange: (status: ProfessionalStatus) => void
}) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const activo = status === 'active'
  const siguiente: ProfessionalStatus = activo ? 'paused' : 'active'

  async function alternar() {
    setError('')
    setGuardando(true)
    // Se pinta el cambio antes de que conteste el servidor: es un interruptor,
    // y esperar medio segundo a que se mueva lo hace sentir roto.
    onChange(siguiente)
    try {
      await setProfessionalStatus(uid, siguiente)
    } catch {
      onChange(status)
      setError('No pudimos cambiarlo. Probá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4',
        // El color vive en el borde y en el icono; el fondo en oscuro es
        // slate, como en el resto de la app.
        activo
          ? 'border-brand-100 bg-brand-50 dark:border-brand-700 dark:bg-slate-900'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-slate-900',
      )}
    >
      <div className="flex items-start gap-3">
        {activo ? (
          <Zap className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
        ) : (
          <Palmtree className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="font-medium">{activo ? 'Estás disponible' : 'Estás en pausa'}</p>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {activo
              ? 'Aparecés en las búsquedas de tu zona y podés recibir solicitudes.'
              : 'No aparecés en las búsquedas. Tus chats, tus solicitudes en curso y tus calificaciones siguen como están.'}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        variant="secondary"
        loading={guardando}
        onClick={() => void alternar()}
        className="w-full"
      >
        {activo ? (
          <>
            <Palmtree className="size-4" aria-hidden />
            Ponerme en pausa
          </>
        ) : (
          <>
            <Zap className="size-4" aria-hidden />
            Volver a estar disponible
          </>
        )}
      </Button>
    </section>
  )
}
