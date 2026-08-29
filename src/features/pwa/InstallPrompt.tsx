import { Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'jobo:install-dismissed'

/**
 * Invita a instalar la app. Chrome/Android dispara `beforeinstallprompt`;
 * en iOS no existe, así que ahí no mostramos nada (se instala desde Compartir).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return

    function onBeforeInstall(event: Event) {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!deferred) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDeferred(null)
  }

  return (
    <div className="mx-4 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex-1">
        <p className="text-sm font-medium">Instalá Jobo en tu celular</p>
        <p className="text-xs text-slate-500">Se abre como una app y recibís los avisos.</p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await deferred.prompt()
          const { outcome } = await deferred.userChoice
          if (outcome === 'accepted') setDeferred(null)
          else dismiss()
        }}
      >
        <Download className="size-4" aria-hidden />
        Instalar
      </Button>
      <button type="button" onClick={dismiss} aria-label="No mostrar más" className="p-1">
        <X className="size-4 text-slate-400" aria-hidden />
      </button>
    </div>
  )
}
