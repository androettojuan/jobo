# Plan para publicar Jobo en Google Play y App Store

Escrito el 2 de septiembre de 2026, sobre el estado que describe `ESTADO.md`.
Hoy Jobo es una PWA (Vite + React + Firebase) desplegada en Firebase Hosting.
Esto es lo que falta para que además sea una app instalable desde las dos
tiendas, sin dejar de ser la web que ya anda.

## La decisión de fondo: Capacitor

Se envuelve la misma app web en un contenedor nativo con **Capacitor**.

Por qué no las alternativas:

- **TWA / Bubblewrap** (la PWA empaquetada por Chrome) sirve para Google Play,
  pero **no existe para iOS**. Habría que mantener dos caminos distintos.
- **Reescribir en React Native / Flutter** tira a la basura el trabajo hecho y
  obliga a mantener dos apps.

Capacitor deja un solo código y agrega dos carpetas (`android/` e `ios/`) que se
versionan como cualquier otra parte del repo. `npm run build` sigue generando
`dist/`, y `npx cap sync` lo copia adentro de los proyectos nativos.

**Advertencia importante**: Apple rechaza por la regla 4.2 ("minimum
functionality") las apps que son solo un navegador con la web adentro. Jobo
zafa porque usa push, cámara y ubicación nativos —pero eso hay que
**implementarlo de verdad con plugins nativos**, no dejarlo en la versión web.
Es la razón por la que la Fase 2 no es opcional.

## Costos y requisitos previos

| Cosa | Detalle |
| --- | --- |
| Cuenta Google Play | USD 25, pago único |
| Cuenta Apple Developer | USD 99 por año, se renueva |
| Mac | Obligatoria para compilar y subir iOS (o un runner macOS en CI: GitHub Actions, Codemagic) |
| Verificación de identidad | Ambas tiendas la piden y tarda días |
| Testing cerrado en Play | Las cuentas personales nuevas necesitan **12 testers durante 14 días seguidos** antes de poder publicar en producción |

Ese último punto es el que más demora en el calendario: conviene abrir la cuenta
de Play y arrancar el testing cerrado apenas haya un APK que funcione, aunque
falten pulidos.

---

## Fase 0 — Lo que bloquea la publicación aunque el código funcione

Nada de esto es técnico-nativo: son requisitos de política que hoy la app **no
cumple**, y que rechazan la publicación de entrada.

### 0.1 Borrado de cuenta (bloqueante en las dos tiendas)

Google Play (política de Data Deletion) y Apple (guía 5.1.1 v) exigen que quien
se registró pueda **borrar su cuenta y sus datos desde adentro de la app**, y
Google exige además una **URL pública** donde pedirlo sin instalar nada.

- Botón "Eliminar mi cuenta" en `/perfil`, con confirmación y reautenticación
  (Firebase pide credencial fresca para borrar).
- Cloud Function `deleteAccount` que borre en cascada: `users/{uid}` y sus
  subcolecciones, `professionals/{uid}`, tokens FCM, fotos en Storage, y que
  **anonimice** lo que no se puede borrar sin romper a terceros (reseñas
  escritas, mensajes en chats ajenos, solicitudes cerradas) → "Usuario
  eliminado", sin nombre, foto ni teléfono.
- Recalcular los agregados que quedan colgando (`ratingAvg`, contadores de
  `stats/categories`).
- Página web `/eliminar-cuenta` explicando el procedimiento, accesible sin
  sesión, para el formulario de Play.

### 0.2 Política de privacidad y términos (bloqueante)

- Política de privacidad en una URL pública y estable (puede vivir en el mismo
  hosting: `/privacidad`). Tiene que decir qué se recolecta —email, nombre,
  teléfono, localidad, fotos, token de dispositivo—, para qué, con quién se
  comparte (Firebase/Google) y cómo se borra.
- Términos y condiciones (`/terminos`), con el EULA que Apple exige para
  contenido generado por usuarios.
- Enlaces a ambas desde el registro y desde `/perfil`.
- Email de contacto de soporte, visible en la app y en las fichas de tienda.

### 0.3 Contenido generado por usuarios (bloqueante en Apple)

La guía 1.2 de Apple pide cuatro cosas para apps con contenido de usuarios.
Jobo tiene dos:

- ✅ Denunciar contenido ofensivo (ya está: denuncias de perfiles y reseñas).
- ✅ Moderación por parte del equipo (panel de admin).
- ❌ **Bloquear usuarios abusivos**: falta. Hay que agregar "Bloquear a esta
  persona" —que impida que le escriba, le pida presupuesto y la vea— con su
  lista en el perfil para desbloquear, más las reglas de Firestore que lo hagan
  cumplir del lado del servidor.
- ❌ **Aceptar los términos antes de publicar contenido**: un checkbox en el
  registro, guardado con fecha.

También hay que comprometerse a moderar denuncias **dentro de las 24 horas**;
conviene un aviso por email al admin cuando entra una denuncia.

### 0.4 Formularios de datos de cada tienda

- **Play – Data Safety**: declarar email, nombre, teléfono, ubicación
  aproximada, fotos, mensajes e identificadores de dispositivo; cifrado en
  tránsito; y que se pueden borrar.
- **Apple – Privacy Nutrition Labels**: lo mismo, con el mapeo de qué se usa
  para "funcionalidad de la app" y qué se vincula a la identidad.
- Clasificación de edad: 17+ / PEGI 12 es lo razonable por el chat libre.

---

## Fase 1 — Poner Capacitor en el repo ✔ hecho

Al 2 de septiembre de 2026 está andando: `npm run cap:sync` compila el build
nativo y lo copia a `android/` e `ios/`, y `android/gradlew assembleDebug`
genera el APK. Lo que quedó armado:

- `capacitor.config.ts` con `appId: com.jobo.app`, `webDir: dist`, los esquemas
  `https` / `capacitor` explícitos y la config de splash y teclado.
- `VITE_TARGET=native` (`npm run build:native`) desactiva `VitePWA`, así que el
  build nativo no lleva service worker ni manifiesto. `disable: true` deja el
  plugin resolviendo `virtual:pwa-register/react`, que es lo que importa
  `UpdatePrompt`, así que el import no se rompe.
- `src/lib/platform.ts` (`isNative`, `platform`, `isAndroid`, `isIOS`) y
  `src/lib/native.ts` (`setupNativeShell()`): barra de estado en modo
  edge-to-edge siguiendo el tema del sistema, splash que se esconde recién
  cuando la app está montada, y el botón atrás de Android enganchado al
  historial del router.
- `AppLayout` ya no dibuja `InstallPrompt` ni `UpdatePrompt` en nativo.
- Orientación bloqueada en vertical en las dos plataformas, y iOS declarado
  solo para iPhone (`TARGETED_DEVICE_FAMILY = "1"`), para que Apple no pruebe
  la app en un iPad.
- Los keystores quedan fuera del repo (`.gitignore`).

Cómo se armó, para referencia:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init Jobo com.jobo.app --web-dir dist
npx cap add android && npx cap add ios
```

- `appId`: `com.jobo.app` (o `ar.com.jobo.app`). **No se puede cambiar nunca
  más** una vez publicada la app: elegirlo con calma.
- `androidScheme: 'https'` en `capacitor.config.ts`, para que Firebase Auth,
  Storage y el `localStorage` existente sigan funcionando con origen seguro.
- `android/` e `ios/` se versionan; el `.gitignore` de Capacitor ya excluye
  `build/`, `Pods/` y demás.
- Script nuevo: `"cap:sync": "npm run build && npx cap sync"`.

### Router y assets

`createBrowserRouter` funciona: Capacitor sirve la app desde `https://localhost`
con History API completa. No hace falta pasar a hash routing. Las rutas
absolutas de assets (`/pwa-192x192.png`) también resuelven bien.

### Desactivar el service worker en el build nativo

Adentro del contenedor, el service worker de `vite-plugin-pwa` no aporta nada y
puede servir **código viejo cacheado** después de una actualización de la
tienda: exactamente el problema que ya costó caro con los push. Hay que
compilar con una bandera (`VITE_TARGET=native`) que:

- desactive `VitePWA` en `vite.config.ts`,
- no dibuje `InstallPrompt` ni `UpdatePrompt` en `AppLayout` (no tienen sentido:
  la app ya está instalada y se actualiza por la tienda),
- registre el FCM nativo en vez del service worker de push.

### Falta probarlo en un teléfono

El APK compila, pero todavía no se instaló en un equipo real. Lo que hay que
mirar apenas se pueda: que la barra de estado no tape el contenido, que la
splash no se quede pegada, que el botón atrás no cierre la app de golpe y que
el teclado no tape el input del chat.

## Fase 2 — Reemplazar las APIs web por plugins nativos

Cada una de estas **no funciona** tal cual está dentro del contenedor, o
funciona peor.

**Estado al 2 de septiembre de 2026**: el código de 2.1, 2.2 y 2.3 está
escrito y compila, pero **no se probó todavía**, porque falta el
`google-services.json` del proyecto Firebase. Sin ese archivo la app nativa no
puede ni inicializar Firebase. 2.4 y 2.5 siguen pendientes.

#### Lo que falta hacer en Firebase Console

En el proyecto `jobo-8b688`, *Configuración del proyecto → Tus apps*:

1. **Agregar app Android** con el paquete `com.jobo.app`.
2. Cargarle la huella **SHA-1 del keystore de debug**, sin la cual el login con
   Google falla con un error opaco:
   `A4:04:6D:D6:07:3B:E5:C5:F4:EB:0D:2C:E7:64:E1:F1:AC:7D:98:A8`
   (sale de `keytool -list -v -keystore ~/.android/debug.keystore -alias
   androiddebugkey -storepass android`). La del keystore de release se suma
   cuando exista, junto con la que agrega Play App Signing.
3. Bajar `google-services.json` y dejarlo en `android/app/`.
4. Para iOS, más adelante: agregar la app con el mismo bundle id, bajar
   `GoogleService-Info.plist` a `ios/App/App/`, y habilitar el proveedor Apple
   en *Authentication → Sign-in method*.

### 2.1 Login con Google — escrito, sin probar

`signInWithPopup` no abre nada en un WebView. Se pasó a
`@capacitor-firebase/authentication`, que hace el login nativo y devuelve un
token para `signInWithCredential`. `src/features/auth/api.ts` tiene la rama por
plataforma; el resto de la app no se entera.

`skipNativeAuth: true` en `capacitor.config.ts` es a propósito: la app entera
habla con Firebase por el SDK de JavaScript, y sin esa opción quedarían dos
sesiones en paralelo —la nativa y la del SDK— que se desincronizan. `logout()`
ahora también cierra la del plugin, si no Google vuelve a entrar derecho con la
última cuenta sin dejar elegir otra.

Requiere en Firebase Console: app Android y app iOS nuevas dentro del proyecto
`jobo-8b688`, con `google-services.json` y `GoogleService-Info.plist`, y las
huellas **SHA-1 y SHA-256** del keystore de debug y del de release cargadas en
la app Android (sin eso, el login de Google falla con un error opaco).

### 2.2 Sign in with Apple — escrito, sin probar

La regla 4.8 exige que, si se ofrece login con Google, se ofrezca también una
opción equivalente que preserve la privacidad. Está en
`src/features/auth/components/ProviderButtons.tsx`, que ahora comparten login y
registro: el botón de Apple aparece **solo en iOS**, con el logotipo que la
guía de Apple exige.

El nombre lo manda Apple **una sola vez**, en el primer login, y en ese momento
el usuario de Firebase todavía no lo tiene: por eso `finishProviderLogin()`
recibe el nombre del plugin como respaldo. Si no se guarda ahí, se pierde para
siempre.

Falta habilitar el proveedor en Firebase Auth y la capability en Xcode.

### 2.3 Push — escrito, sin probar

El circuito anterior —service worker web + `getToken` con clave VAPID— es
exclusivo del navegador. Lo que quedó:

- `src/features/notifications/nativePush.ts` envuelve
  `@capacitor-firebase/messaging`; `api.ts` elige el camino según la
  plataforma, y la web sigue exactamente como estaba.
- **Los tokens ahora se guardan con su plataforma.** `users/{uid}.fcmTokens`
  pasó de `string[]` a `{ token, platform }[]`. El objeto no lleva fecha a
  propósito: `arrayUnion` solo deduplica si el objeto coincide entero, y con un
  `updatedAt` adentro cada registro del mismo equipo sumaría una entrada nueva.
- `functions/src/shared.ts` agrupa los tokens por plataforma y manda un envío
  por grupo, porque `sendEachForMulticast` manda un solo mensaje a muchos
  tokens. La web sigue con solo `data` + `webpush` (con `notification` se
  vería el aviso duplicado, una vez por el SDK y otra por el service worker);
  Android y iOS llevan `notification` —sin eso no se dibuja nada con la app
  cerrada— más `android.priority: high` y `apns-priority: 10`.
- Lee las dos formas del array, la vieja y la nueva, y **descarta los
  repetidos**: un navegador ya registrado se vuelve a guardar con la forma
  nueva y quedaría el mismo token dos veces, o sea cada aviso duplicado.
  `scripts/backfill-fcm-tokens.mjs` deja el array limpio (idempotente, y sin
  `--escribir` solo muestra qué haría).
- El aviso de Android necesita su propio icono: el sistema aplana estos iconos
  a un solo color, así que el del lanzador se vería como un cuadrado blanco.
  `android/app/src/main/res/drawable/ic_stat_jobo.xml` es la misma "J" del
  favicon sin el fondo verde, y el manifiesto la declara como la de por
  defecto.
- El tap sobre el aviso navega al `link` con el router
  (`notificationActionPerformed`, en `ForegroundToast`), igual que hace
  `notificationclick` en la web.
- Falta iOS: la **clave APNs** (`.p8`) subida a Firebase y las capabilities de
  Push Notifications y Background Modes en Xcode. Sin eso no llega un solo
  aviso, y no avisa: falla en silencio.

### 2.4 Cámara y fotos

`<input type="file">` funciona en ambos WebViews, pero la experiencia nativa es
mejor y evita rarezas de iOS. Con `@capacitor/camera` se elige entre cámara y
galería, y se conserva la compresión que ya hace `PhotoPicker`.

Textos de permiso obligatorios en `Info.plist` —Apple rechaza si faltan o si son
genéricos—: `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription`,
explicando en castellano para qué se usan.

### 2.5 Ubicación

El "Detectar" de `src/lib/localities.ts` usa `navigator.geolocation`, que en
WebView necesita que el contenedor conceda el permiso del sistema. Con
`@capacitor/geolocation` se resuelve solo. Hace falta:

- Android: `ACCESS_COARSE_LOCATION` en el manifiesto (alcanza la aproximada, que
  es todo lo que Jobo usa; pedir la fina obliga a justificarla en Play).
- iOS: `NSLocationWhenInUseUsageDescription`.

### 2.6 Comportamientos de plataforma

- **Botón atrás de Android**: sin manejarlo, cierra la app desde cualquier
  pantalla. Hay que engancharlo al historial del router y salir solo desde la
  home, con el doble toque de siempre.
- **Barra de estado**: `@capacitor/status-bar` con el verde de la marca y estilo
  claro/oscuro según el tema.
- **Splash screen**: `@capacitor/splash-screen`, ocultándola cuando la app está
  lista, para que no se vea el flash blanco del WebView.
- **Teclado**: `@capacitor/keyboard` para que el input del chat no quede tapado.
- Las `safe-top` / `safe-bottom` que ya usa `AppLayout` siguen sirviendo.

## Fase 3 — Identidad, íconos y firma

- `@capacitor/assets` genera todos los tamaños de ícono y splash desde el SVG.
  Android necesita **ícono adaptativo** (capa de fondo + capa de primer plano);
  iOS, un PNG de 1024×1024 **sin transparencia ni esquinas redondeadas** (lo
  rechazan si las trae).
- Vale la pena resolver acá lo que `ESTADO.md` deja anotado: el logo actual es
  un calco de un PNG de 110×44 px. Un ícono de tienda a 1024 px va a mostrar
  cada irregularidad.
- **Android**: crear el keystore de release y guardarlo fuera del repo, con
  respaldo. Si se pierde, no se puede volver a firmar la app nunca —salvo que se
  use Play App Signing, que conviene activar por eso mismo.
- **iOS**: certificados y perfiles de aprovisionamiento en el portal de Apple,
  o dejar que Xcode los administre.
- Versionado: `versionCode` / `versionName` en `android`, `CFBundleVersion` /
  `CFBundleShortVersionString` en iOS. Conviene un script que los tome del
  `package.json` para no desincronizarlos a mano.

## Fase 4 — Fichas de tienda

- Nombre, subtítulo, descripción corta y larga en castellano rioplatense.
- **Capturas**: teléfono Android (mínimo 2) y iPhone 6.7" y 6.9" (obligatorias);
  iPad solo si se declara compatibilidad —conviene **no** declararla, porque la
  app es mobile-only y Apple prueba en iPad si decís que anda ahí.
- Gráfico destacado de Play (1024×500).
- Cuenta de prueba para los revisores de Apple, con datos cargados: si abren la
  app y ven la home en gris con "sin nadie aún" en todos los rubros, la rechazan
  por 2.1 (contenido incompleto). **Esto se cruza con lo que ya está anotado
  como pendiente: cargar profesionales reales.**
- Categoría, palabras clave, país (Argentina), clasificación de edad.

## Fase 5 — Antes de mandar a revisión

- Probar en un Android real y en un iPhone real: login por email, por Google y
  por Apple; push con la app cerrada; foto desde cámara y desde galería;
  detección de localidad; botón atrás; chat con el teclado abierto.
- Modo avión y red mala: que ninguna pantalla quede colgada en el esqueleto.
- Borrado de cuenta de punta a punta, con una cuenta descartable.
- La regla de `AGENTS.md` sigue valiendo: `npm run typecheck`, `npm run lint`,
  `npm run test:ui` y react-doctor en verde antes de cerrar cada tramo.

## Orden sugerido

1. **Fase 0** (cuentas, borrado de cuenta, privacidad, bloqueo de usuarios).
   Es lo único que no depende de nada y bloquea todo lo demás; además sirve
   igual para la PWA que ya está publicada.
2. Abrir las cuentas de desarrollador en paralelo: la verificación tarda.
3. **Fase 1 + 2** en Android primero, que se prueba en cualquier máquina.
4. Subir a testing cerrado de Play apenas ande, para que corran los 14 días
   mientras se sigue trabajando.
5. **iOS** (necesita la Mac): Sign in with Apple, APNs, permisos del `Info.plist`.
6. Fases 3 a 5 y envío.

## Lo que hay que decidir

- `appId` definitivo (no se cambia nunca más).
- Si iOS entra ahora o después: son USD 99 al año más una Mac, y la revisión de
  Apple es bastante más estricta que la de Google.
- Si la web sigue siendo PWA instalable además de estar en las tiendas.
  Recomendado que sí: es la puerta de entrada de quien no quiere instalar nada,
  y ya funciona.
