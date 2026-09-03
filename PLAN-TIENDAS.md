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

## Fase 0 — Lo que bloquea la publicación aunque el código funcione ✔ hecho

Nada de esto es técnico-nativo: son requisitos de política. Al 3 de septiembre
de 2026 están los tres cubiertos; queda solo llenar los formularios de cada
tienda (0.4), que es trabajo de consola, no de código.

### 0.1 Borrado de cuenta ✔

`functions/src/account.ts` (`deleteAccount`, callable) y el botón al final de
`/perfil`, que pide escribir ELIMINAR.

Lo propio se borra; lo que es de a dos se anonimiza. Un chat, una reseña o una
solicitud no son solo de quien se va: borrarlos le rompería el historial a la
otra persona, y sacar una calificación le cambiaría el promedio a un
profesional por algo que no hizo. Las solicitudes abiertas se cancelan y se le
avisa al otro, con el tipo `request_cancelled` que se sumó para eso.

La cuenta de Auth se borra **al final** a propósito: si algo falla antes, la
persona sigue pudiendo entrar y reintentar en vez de quedarse sin cuenta y con
los datos a medio borrar.

Se probó contra los emuladores con un escenario de a dos y 19 comprobaciones
sobre qué se borró, qué quedó anonimizado y qué no se tocó.

En vez de reautenticar se pide escribir una palabra. Firebase no exige
credencial fresca porque el borrado lo hace el Admin SDK, y forzar un
`auth_time` reciente dejaba sin salida a quien entró con Google hace rato
—incluido el revisor de la tienda probando justo esto—.

`/eliminar-cuenta` cubre lo que el botón no cubre: la URL pública que pide
Google Play para pedir el borrado sin instalar nada.

### 0.2 Política de privacidad y términos ✔

`/privacidad`, `/terminos` y `/eliminar-cuenta`, fuera del `AppLayout` para que
se abran desde cualquier navegador sin sesión. El contacto y la edad mínima
salen de `src/lib/contacto.ts`, un solo lugar.

**Falta que las lea un abogado.** Lo que hay describe con precisión lo que la
app hace, pero no es una opinión legal.

### 0.3 Contenido generado por usuarios ✔

Las cuatro cosas que pide la guía 1.2 de Apple:

- ✅ Denunciar contenido ofensivo (ya estaba).
- ✅ Moderación por parte del equipo (panel de admin).
- ✅ **Bloquear usuarios**: `src/features/blocks/`, y lo hacen cumplir las
  reglas de Firestore, no la pantalla. Corta en las dos direcciones y tiene 9
  tests.
- ✅ **Aceptar los términos antes de publicar**: checkbox en el registro, con
  constancia en `acceptedTermsAt` que el cliente no puede reescribir.

Queda pendiente el compromiso de moderar denuncias **dentro de las 24 horas**:
hoy `onReportCreated` solo deja una línea en los logs. Conviene un aviso por
email al admin, o revisar el panel a diario.

### 0.4 Formularios de datos de cada tienda — pendiente

Es lo único de la Fase 0 que queda, y es trabajo de consola. Las respuestas ya
están redactadas en `FICHAS-TIENDA.md`, sacadas del modelo de datos real: qué
se recolecta, con qué finalidad y qué se vincula a la identidad.

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

Probado en un Android real: arranca, la splash se va sola y el botón atrás
navega en vez de cerrar la app.

## Fase 2 — Reemplazar las APIs web por plugins nativos

Cada una de estas **no funciona** tal cual está dentro del contenedor, o
funciona peor.

**Estado al 3 de septiembre de 2026**: todo escrito. El login con Google está
**probado y andando** en un Android real; el resto compila pero no se ejercitó
de punta a punta. Lo de iOS no corrió nunca.

#### Firebase Console — hecho para Android

La app Android existe en `jobo-8b688`
(`1:891114567956:android:b96c9e260e44523de06a01`, paquete `com.jobo.app`), con
las huellas SHA-1 y SHA-256 del **keystore de debug** cargadas y
`google-services.json` en `android/app/`. Todo se hizo por CLI:

```bash
npx firebase apps:create ANDROID "Jobo Android" --package-name com.jobo.app
npx firebase apps:android:sha:create <appId> <SHA>
npx firebase apps:sdkconfig ANDROID <appId> --out android/app/google-services.json
```

De ahí sale el recurso `default_web_client_id`, sin el cual Google no devuelve
token de identidad y el login falla con un error opaco. Lo mismo pasa si falta
la huella del keystore que firmó el APK: **cuando exista el de release hay que
sumar su SHA-1**, y la que agrega Play App Signing.

Para iOS falta: agregar la app con el mismo bundle id, bajar
`GoogleService-Info.plist` a `ios/App/App/`, habilitar el proveedor Apple en
*Authentication → Sign-in method* y subir la clave APNs.

### 2.1 Login con Google ✔ probado

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

### 2.3 Push — desplegado, falta confirmarlo con la app cerrada

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

### 2.4 Cámara y fotos ✔ escrito, sin probar

`<input type="file">` funciona en ambos WebViews, pero abre el explorador de
archivos: para mandar una foto en un chat lo que hace falta es la cámara.
`src/components/ui/PhotoInput.tsx` es el mismo disparador para los tres lugares
donde se elige una foto y se ramifica por plataforma; la compresión que ya
hacía `uploadImage` no cambió.

Textos de permiso obligatorios en `Info.plist` —Apple rechaza si faltan o si son
genéricos—: `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription`,
explicando en castellano para qué se usan.

### 2.5 Ubicación ✔ escrito, sin probar

El "Detectar" de `src/lib/localities.ts` usa `navigator.geolocation`, que existe
en el WebView pero cuyo permiso lo concede el sistema operativo: sin plugin,
nadie lo pide. Con `@capacitor/geolocation` se resuelve, y `detectLocality` pasó
de un constructor de promesa a `async` para que la rama por plataforma no lo
volviera ilegible.

Se pide **solo la aproximada** (`ACCESS_COARSE_LOCATION`, sin la fina): es todo
lo que hace falta para adivinar el pueblo y evita tener que justificar la
precisa ante Google Play. Los textos del `Info.plist` están en castellano.

### 2.6 Comportamientos de plataforma ✔

Todo en `src/lib/native.ts`, salvo lo que es de tema: botón atrás enganchado al
historial del router, barra de estado de punta a punta siguiendo el tema del
sistema, splash escondida recién cuando la app está montada y teclado que
empuja el WebView.

Dibujar de punta a punta destapó tres cosas que no se ven en el navegador:

- El `pb-20` fijo no alcanza. La barra de abajo mide su alto **más** lo que el
  sistema reserve, y en un teléfono con los tres botones eso son casi 50px más:
  el último botón de cada pantalla quedaba cortado. De ahí `.pb-nav`.
- El contenido pasaba por abajo de la hora y la batería al scrollear, porque no
  hay nada pintado en ese hueco. De ahí `.status-scrim`.
- La barra de navegación de Android se dibujaba blanca sobre la app en oscuro:
  el tema de la aplicación es `Theme.AppCompat.Light` y de ahí heredaba el
  color de los iconos. Se controla explícitamente con un `bool` que cambia en
  `values-night`.

Y una que no es de plataforma pero se ve igual: `html` y `body` tienen
`overflow: hidden` porque el scroll lo maneja el `<main>` del `AppLayout`. Toda
pantalla que viva **fuera** de ese layout —login, registro, legales— necesita
su propio `h-full overflow-y-auto`, o queda recortada. Y el contenedor que
scrollea no puede ser el mismo que centra con `justify-center`: en una pantalla
corta, lo que se pasa por arriba queda inalcanzable.

## Fase 3 — Identidad, íconos y firma — a medias

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
- Versionado: `node scripts/set-version.mjs <version> [--build N]` pone la
  misma en `package.json`, Android e iOS. El build nunca puede bajar: Play
  rechaza un AAB con un `versionCode` ya usado y App Store Connect hace lo
  mismo. Va en **1.0.0, build 1**.

**Hecho**: los iconos y la splash de las dos plataformas, generados desde el
mismo SVG del que salen el favicon y los iconos de la PWA
(`node scripts/generate-assets.mjs` y después `npx capacitor-assets generate`).
Tres detalles que cuestan un rechazo o se ven feo:

- El icono va sin canal alfa: la App Store rechaza los que lo tienen, y un PNG
  rasterizado desde SVG sale con alfa aunque el fondo sea opaco.
- Sin esquinas redondeadas: las pone cada sistema. El SVG de la marca trae un
  `rx` que las dejaría transparentes.
- El fondo del icono adaptativo de Android va **sin `inset`**. La herramienta lo
  genera con 16.7% de margen, que tapa justo el área visible pero deja las
  esquinas transparentes, y se ven en los lanzadores que mueven el icono con el
  dedo.

**Falta**: el keystore de release y los certificados de Apple. Son secretos, no
van al repo. Cuando exista el keystore hay que cargar su SHA-1 en Firebase, o
el login con Google falla en el build firmado.

## Fase 4 — Fichas de tienda

Los textos y las respuestas de los formularios están redactados en
`FICHAS-TIENDA.md`. Lo que sigue es el checklist de lo que hay que juntar:

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

## Qué falta, al 3 de septiembre de 2026

Todo lo que queda necesita algo que no está en el repo: una cuenta, un secreto
o una Mac.

1. **Keystore de release de Android**, guardado fuera del repo y con respaldo.
   Si se pierde no se puede volver a actualizar la app nunca, salvo con Play
   App Signing activado —que conviene activar justamente por eso—. Su SHA-1 va
   cargado en Firebase.
2. **Cuentas de desarrollador**, si no están: la verificación de identidad
   tarda días en las dos.
3. **Testing cerrado de Play**: las cuentas personales nuevas necesitan 12
   testers durante 14 días seguidos antes de poder ir a producción. Conviene
   arrancarlo apenas haya un AAB firmado, aunque falten pulidos.
4. **Cargar profesionales reales.** Si el revisor abre la app y ve la home en
   gris con "sin nadie aún" en todos los rubros, la rechaza por contenido
   incompleto. Esto ya estaba anotado en `ESTADO.md` como lo único pendiente
   del proyecto, y ahora además bloquea la publicación.
5. **iOS entero**: Mac o runner macOS, clave APNs, capabilities en Xcode y
   probar Sign in with Apple, que está escrito y nunca corrió.
6. **Que un abogado lea** la privacidad y los términos.

## Decisiones ya tomadas

- `appId`: **`com.jobo.app`**. No se cambia nunca más.
- La web **sigue siendo PWA instalable** además de estar en las tiendas: es la
  puerta de entrada de quien no quiere instalar nada, y ya funciona. `npm run
  build` sigue generando exactamente lo de siempre; el build nativo es aparte.
