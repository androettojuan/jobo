import { useEffect, useId, useRef } from 'react'

import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  /** true para el rojo de "esto no se deshace". */
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmación modal sobre `<dialog>`: el navegador ya se encarga del foco,
 * del fondo y de cerrar con Escape, así que no hace falta reimplementarlo.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-slate-900 backdrop:bg-black/40 dark:bg-slate-900 dark:text-slate-100"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
