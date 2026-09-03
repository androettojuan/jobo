import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { deleteAccount } from '@/features/auth/api'

/** Lo que hay que escribir para confirmar. En mayúsculas, para que cueste. */
const PALABRA = 'ELIMINAR'

/**
 * Borrado de cuenta. Las dos tiendas lo exigen desde adentro de la app.
 *
 * Empieza cerrado y pide escribir una palabra: es irreversible y no queremos
 * que salga de un toque distraído en la pantalla de perfil.
 */
export function DeleteAccount() {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')

  async function borrar() {
    setError('')
    setBorrando(true)
    try {
      await deleteAccount()
      navigate('/', { replace: true })
    } catch {
      setError('No pudimos eliminar tu cuenta. Probá de nuevo en un rato.')
      setBorrando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="py-3 text-sm text-slate-500 underline underline-offset-4"
      >
        Eliminar mi cuenta
      </button>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-red-200 p-4 dark:border-red-900">
      <h2 className="font-medium">Eliminar mi cuenta</h2>

      <p className="text-sm text-slate-500">
        Se borran tu perfil, tus fotos, tus avisos y —si tenías uno— tu perfil profesional con sus
        calificaciones. Es para siempre: no hay forma de recuperarlo.
      </p>
      <p className="text-sm text-slate-500">
        Tus chats y las reseñas que escribiste quedan, pero sin tu nombre ni tu foto: son de a dos,
        y borrarlos le rompería el historial a la otra persona. Las solicitudes que estén abiertas
        se cancelan.
      </p>

      <Input
        label={`Escribí ${PALABRA} para confirmar`}
        value={confirmacion}
        onChange={(event) => setConfirmacion(event.target.value)}
        autoComplete="off"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="danger"
          loading={borrando}
          disabled={confirmacion.trim() !== PALABRA}
          onClick={() => void borrar()}
        >
          Eliminar mi cuenta
        </Button>
        <Button
          variant="ghost"
          disabled={borrando}
          onClick={() => {
            setAbierto(false)
            setConfirmacion('')
            setError('')
          }}
        >
          Cancelar
        </Button>
      </div>
    </section>
  )
}
