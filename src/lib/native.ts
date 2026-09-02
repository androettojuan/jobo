import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { Style, StatusBar } from '@capacitor/status-bar'

import { isAndroid, isNative } from './platform'

/**
 * Ajustes que solo tienen sentido adentro del contenedor nativo: barra de
 * estado, splash y el botón "atrás" de Android.
 *
 * Se llama una sola vez al arrancar. En la web no hace nada.
 */
export async function setupNativeShell() {
  if (!isNative) return

  try {
    // La app se dibuja de punta a punta y las clases `safe-top` / `safe-bottom`
    // se encargan del recorte, igual que en la PWA instalada. Desde Android 15
    // el sistema fuerza este modo de todas formas.
    await StatusBar.setOverlaysWebView({ overlay: true })
    // `Default` sigue el tema del sistema: iconos oscuros sobre fondo claro y
    // al revés. La app ya vive con `color-scheme: light dark`.
    await StatusBar.setStyle({ style: Style.Default })

    if (isAndroid) {
      // Sin esto, el botón físico cierra la app desde cualquier pantalla.
      // `canGoBack` mira el historial del WebView, que es el mismo que maneja
      // React Router.
      await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back()
        else void App.exitApp()
      })
    }
  } finally {
    // En el `finally` para que un error en cualquiera de los pasos anteriores
    // no deje la app tapada por la splash para siempre.
    await SplashScreen.hide()
  }
}
