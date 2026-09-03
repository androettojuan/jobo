import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { loginWithApple, loginWithGoogle } from '@/features/auth/api'
import { isIOS } from '@/lib/platform'

/** El logotipo de Apple, que la guía de "Sign in with Apple" exige mostrar. */
function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.81 3.15-.46 7.81 1.3 10.37.86 1.25 1.89 2.66 3.24 2.61 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.28 3.13-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.05-2.75-4.16zM14.5 4.76c.71-.87 1.19-2.07 1.06-3.26-1.02.04-2.26.68-3 1.54-.66.77-1.24 2-1.08 3.17 1.14.09 2.3-.58 3.02-1.45z" />
    </svg>
  )
}

/**
 * Los ingresos con proveedor, compartidos por login y registro.
 *
 * Apple aparece solo en iOS: la regla 4.8 de la App Store exige una
 * alternativa que preserve la privacidad cuando se ofrece login con Google,
 * pero fuera de iOS no aporta nada y suma un camino más para mantener.
 */
export function ProviderButtons({
  disabled,
  onRun,
}: {
  disabled: boolean
  onRun: (action: () => Promise<unknown>) => void
}) {
  // Entrar con un proveedor tarda: hay que canjear el token y leer el perfil.
  // Sin esto los botones solo se apagaban, y una pantalla quieta durante dos
  // segundos se lee como una app colgada, no como una que está trabajando.
  const [tocado, setTocado] = useState<'google' | 'apple' | null>(null)

  function correr(proveedor: 'google' | 'apple', action: () => Promise<unknown>) {
    setTocado(proveedor)
    onRun(action)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="secondary"
        size="lg"
        disabled={disabled}
        loading={disabled && tocado === 'google'}
        onClick={() => correr('google', loginWithGoogle)}
      >
        Continuar con Google
      </Button>

      {isIOS && (
        <Button
          variant="secondary"
          size="lg"
          disabled={disabled}
          loading={disabled && tocado === 'apple'}
          onClick={() => correr('apple', loginWithApple)}
          className="bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          {!(disabled && tocado === 'apple') && <AppleMark />}
          Continuar con Apple
        </Button>
      )}
    </div>
  )
}
