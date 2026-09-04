import { useState } from 'react'

import { ReportButton } from '@/features/reports/ReportButton'

/**
 * Denunciar un mensaje ajeno, sin ensuciar el chat.
 *
 * Empieza como un enlace chiquito debajo de la burbuja y recién ahí despliega
 * el formulario: una conversación de veinte mensajes con veinte botones de
 * denuncia a la vista sería ilegible, y denunciar es lo que menos pasa.
 */
export function MessageReport({ chatId, messageId }: { chatId: string; messageId: string }) {
  const [abierto, setAbierto] = useState(false)

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="self-start text-[11px] text-slate-400 hover:text-red-600"
      >
        Denunciar
      </button>
    )
  }

  return (
    <ReportButton
      targetType="message"
      targetId={messageId}
      chatId={chatId}
      label="Denunciar este mensaje"
    />
  )
}
