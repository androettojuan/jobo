import { Capacitor } from '@capacitor/core'

/**
 * Si la app corre adentro del contenedor nativo (Capacitor) o en un navegador.
 *
 * En la web el paquete de Capacitor sigue estando —viaja en el bundle— pero
 * `isNativePlatform()` devuelve `false`, así que una sola compilación sabría
 * comportarse en los dos lados. Igual el build nativo se hace aparte
 * (`VITE_TARGET=native`), porque hay diferencias que se resuelven en tiempo de
 * compilación, como apagar el service worker.
 */
export const isNative = Capacitor.isNativePlatform()

/** `'android' | 'ios' | 'web'`. Se usa para registrar el token de push. */
export const platform = Capacitor.getPlatform()

export const isAndroid = platform === 'android'
export const isIOS = platform === 'ios'
