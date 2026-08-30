import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from '@/components/ui/Button'

/** Cada cuánto se pregunta si hay versión nueva, con la app abierta. */
const CHECK_EVERY_MS = 60 * 60 * 1000

/**
 * Aviso de "hay una versión nueva". Con `registerType: 'prompt'` el service
 * worker espera a que la persona acepte, así no se recarga la app en medio
 * de un chat.
 *
 * El navegador, por su cuenta, casi no busca actualizaciones en una PWA
 * instalada que vive en segundo plano: puede quedarse días con la versión
 * vieja sin enterarse. Por eso preguntamos nosotros, cada tanto y cada vez
 * que la app vuelve al frente.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return

      const check = () => {
        if (document.visibilityState === 'visible') void registration.update()
      }

      const timer = setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', check)
      // No hay desmontaje que valga: el componente vive mientras la app.
      void timer
    },
  })

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
