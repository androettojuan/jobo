import { Flag } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import type { ReportReason, ReportTargetType } from '@/types/models'

import { createReport, REPORT_REASONS } from './api'

interface ReportButtonProps {
  targetType: ReportTargetType
  targetId: string
  /** Obligatorio al denunciar un mensaje: sin el chat no se lo puede ubicar. */
  chatId?: string
  label?: string
}

/** Botón de denuncia con su formulario desplegable. */
export function ReportButton({
  targetType,
  targetId,
  chatId,
  label = 'Denunciar',
}: ReportButtonProps) {
  const { firebaseUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('fraud')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // No tiene sentido denunciarse a uno mismo ni denunciar sin cuenta.
  if (!firebaseUser || firebaseUser.uid === targetId) return null

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!firebaseUser) return

    setError('')
    setSending(true)
    try {
      await createReport({
        reporterId: firebaseUser.uid,
        targetType,
        targetId,
        chatId,
        reason,
        details,
      })
      setSent(true)
      setOpen(false)
    } catch {
      setError('No pudimos enviar la denuncia. Probá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-emerald-600">
        Gracias. Un administrador va a revisar tu denuncia.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 self-start text-sm text-slate-500 hover:text-red-600"
      >
        <Flag className="size-4" aria-hidden />
        {label}
      </button>

      {open && (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="motivo" className="text-sm font-medium">
              Motivo
            </label>
            <select
              id="motivo"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
            >
              {REPORT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Contanos qué pasó"
            required
            maxLength={600}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="danger" loading={sending}>
              Enviar denuncia
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
