import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { deleteReportedMessage } from '@/features/admin/api'
import type { Report } from '@/types/models'

/**
 * El mensaje denunciado, y solo ese.
 *
 * El admin no tiene acceso a la conversación: lo que se muestra es la copia
 * que guardó una Cloud Function al entrar la denuncia, leyendo el mensaje real.
 * Que sea una copia además conserva la prueba aunque el mensaje se borre
 * después.
 */
export function ReportedMessage({ report }: { report: Report }) {
  const [borrado, setBorrado] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')

  const copia = report.reportedMessage

  if (copia === null) {
    return <p className="text-xs text-slate-500">El mensaje ya no está en el chat.</p>
  }
  if (!copia) {
    // La función escribe la copia enseguida; si falta, la denuncia es de antes
    // de que esto existiera o el trigger no llegó a correr.
    return <p className="text-xs text-slate-500">Sin copia del mensaje denunciado.</p>
  }

  async function borrar() {
    if (!report.chatId) return
    setError('')
    setBorrando(true)
    try {
      await deleteReportedMessage(report.chatId, report.targetId)
      setBorrado(true)
    } catch {
      setError('No pudimos borrarlo. Probá de nuevo.')
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
      {copia.text && <p className="text-sm whitespace-pre-line">{copia.text}</p>}
      {copia.imageUrl && (
        <a href={copia.imageUrl} target="_blank" rel="noreferrer">
          <img
            src={copia.imageUrl}
            alt="Foto denunciada"
            className="max-h-40 rounded-xl object-cover"
          />
        </a>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {borrado ? (
        <p className="text-xs text-emerald-600">Borrado del chat.</p>
      ) : (
        <Button
          size="sm"
          variant="danger"
          loading={borrando}
          disabled={!report.chatId}
          onClick={() => void borrar()}
          className="self-start"
        >
          <Trash2 className="size-4" aria-hidden />
          Borrar el mensaje
        </Button>
      )}
    </div>
  )
}
