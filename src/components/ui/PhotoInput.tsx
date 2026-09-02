import type { ReactNode } from 'react'

import { pickPhoto } from '@/lib/photos'
import { isNative } from '@/lib/platform'

interface PhotoInputProps {
  onPick: (file: File) => void
  className: string
  'aria-label'?: string
  disabled?: boolean
  children: ReactNode
}

/**
 * Disparador para elegir una foto, con el aspecto que le dé quien lo use.
 *
 * En la web es un `<label>` con un `<input type="file">` escondido adentro,
 * que es la forma de que el control se vea como uno quiera. En nativo es un
 * botón que abre la cámara o la galería del sistema.
 */
export function PhotoInput({
  onPick,
  className,
  'aria-label': ariaLabel,
  disabled = false,
  children,
}: PhotoInputProps) {
  if (isNative) {
    // `pickPhoto` ya devuelve `null` cuando cancelan o cuando no se pudo leer
    // la foto; el `catch` es por si el plugin falla de una forma imprevista,
    // que no debería tumbar la pantalla entera.
    async function elegir() {
      try {
        const file = await pickPhoto()
        if (file) onPick(file)
      } catch {
        // Sin foto y sin ruido: se puede volver a intentar.
      }
    }

    return (
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={className}
        onClick={() => void elegir()}
      >
        {children}
      </button>
    )
  }

  return (
    <label aria-label={ariaLabel} className={className}>
      {children}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onPick(file)
          // Sin esto, elegir dos veces la misma foto no dispara el `change`.
          event.target.value = ''
        }}
      />
    </label>
  )
}
