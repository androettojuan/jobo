import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/components/ui/Button'

/**
 * Aviso de "hay una versión nueva". Con `registerType: 'prompt'` el service
 * worker espera a que la persona acepte, así no se recarga la app en medio
 * de un chat.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
    >
      <p className="flex-1 text-sm">Hay una versión nueva de Jobo.</p>
      <Button size="sm" onClick={() => void updateServiceWorker(true)}>
        Actualizar
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
        Después
      </Button>
    </div>
  )
}
