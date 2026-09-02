import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.jobo.app',
  appName: 'Jobo',
  webDir: 'dist',
  server: {
    // Ambos son el default de Capacitor 8; se dejan escritos porque de ellos
    // depende que el WebView corra sobre un origen seguro
    // (`https://localhost` en Android, `capacitor://localhost` en iOS). Sin
    // eso se caen Firebase Auth, el `localStorage` que ya usa la app y la
    // geolocalización del botón "Detectar".
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    FirebaseAuthentication: {
      // La app entera habla con Firebase por el SDK de JavaScript. El plugin
      // solo abre la pantalla nativa y devuelve el token; la sesión la abre
      // después `signInWithCredential`. Sin `skipNativeAuth` quedarían dos
      // sesiones en paralelo, la nativa y la del SDK, que se desincronizan.
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com'],
    },
    SplashScreen: {
      // La esconde `setupNativeShell()` cuando la app ya está montada, así no
      // se ve el destello blanco del WebView vacío entre medio.
      launchAutoHide: false,
      backgroundColor: '#09bc8a',
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      // El teclado empuja el WebView en vez de taparlo: el input del chat vive
      // pegado al borde de abajo.
      resize: 'native',
    },
  },
}

export default config
