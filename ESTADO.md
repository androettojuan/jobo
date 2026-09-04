# Estado del proyecto

Registro para retomar el trabajo más adelante.
Última actualización: **3 de septiembre de 2026**.

El código vive en GitHub: `androettojuan/jobo` (repo privado).

## Dónde estamos

Reescritura de `jobo-next-2` (Next 14 + JSX + API en localhost:8080) como PWA
mobile-first con **Vite + React + TypeScript + Firebase**. El repo viejo queda
intacto como referencia; este proyecto no depende de él.

Proyecto Firebase: **`jobo-8b688`**, en plan Blaze. Ya están en producción las
reglas de Firestore y Storage, los índices, el catálogo (32 oficios y 8
localidades) y las 11 Cloud Functions. El login por email y por Google está
habilitado. Verificado end to end contra producción: registro, perfil
profesional y recálculo de contadores por la función en la nube.

**La app está publicada en https://jobo-8b688.web.app.** La clave VAPID de
push está cargada en `.env.local` (no se versiona: si se clona el repo en otra
máquina hay que volver a sacarla de Firebase Console → Cloud Messaging) y
`juan.androetto36@gmail.com` ya tiene el custom claim de super admin, con el
panel en `/admin`.

## Decisiones tomadas

- **Cuenta única.** Todos se registran igual; quien quiere ofrecer servicios
  activa su perfil profesional. Un plomero puede contratar un electricista.
- **Hasta 5 oficios por profesional**, y el chat recuerda por cuál lo
  contactaron.
- **Buscar no es una pantalla aparte.** Se busca desde la home: el campo de
  texto y los rubros filtran ahí mismo y los resultados ocupan el lugar de la
  grilla de oficios. `/buscar` quedó solo como redirección a la raíz.
- **Ubicación por localidad, nunca GPS preciso.** El botón "Detectar" usa el
  GPS solo en el momento para adivinar el pueblo más cercano del catálogo,
  que ahora cubre las 4037 localidades del país.
- **La solicitud es el hilo conductor**: habilita el chat, libera el teléfono
  al aceptarse y, al completarse, habilita la reseña (una por solicitud).
- **Los agregados los escriben Cloud Functions**, nunca el cliente
  (`ratingAvg`, `unreadCount`, `stats/categories`, `completedJobs`).
- **Un push por mensaje, una entrada por conversación.** Al teléfono llega un
  aviso por cada mensaje, como en cualquier chat; el historial dentro de la
  app guarda una sola entrada por chat, que se va actualizando.
- **Admin por custom claim** de Firebase Auth, no por un campo en Firestore.
- Solo vista móvil por ahora; no se prioriza desktop.

## Hecho y verificado

El circuito completo (registro → perfil profesional → solicitud → chat →
estados → reseña → rating recalculado) se probó contra los emuladores, y el
tramo de registro, perfil y contadores también contra producción:

- Auth con email y con Google; perfil de usuario editable (nombre, teléfono con
  visibilidad configurable, localidad, foto).
- Perfil profesional: oficios, zonas de trabajo, precios, fotos, pausar/activar.
- Búsqueda desde la home por rubro, localidad y texto, con contador de
  disponibles por pueblo.
- **Catálogo de localidades de todo el país**: las 4037 que publica la API
  Georef del Estado (INDEC, IGN y BAHRA), regenerables con
  `node scripts/fetch-localities.mjs > src/lib/data/localities.json`. Viaja en
  su propio archivo (83 KB comprimidos) que el navegador baja recién cuando
  hace falta elegir o adivinar un pueblo, así que el arranque de la app no
  engordó. Las ocho de Calamuchita conservan su id viejo, para no migrar los
  perfiles y solicitudes que ya están guardados. La colección `localities` de
  Firestore quedó fuera del seed: no la leía nadie.
- Se elige localidad buscando por nombre, no con un `<select>`: con cuatro mil
  no se puede a dedo, y el desplegable nativo en modo oscuro se pintaba con
  fondo claro y texto claro, ilegible.
- Solicitud de presupuesto con matriz de transiciones de estado, validada
  también en las reglas de seguridad.
- Chat en tiempo real, etiquetado por oficio y con filtro por oficio en la
  casilla; no leídos por chat.
- Reseñas 1-5 con derecho a réplica del profesional.
- Notificaciones in-app y push (FCM) con service worker propio.
- Panel del profesional (sus números y solicitudes recibidas, filtrables).
- Panel de admin: denuncias, oficios propuestos (aprobar/renombrar/unificar),
  verificación de profesionales, suspensión de cuentas.
- Denuncias desde perfiles y reseñas.
- Fotos en solicitudes, en el chat, en el perfil profesional y avatar, con
  compresión en el navegador antes de subir (máx. 1600px, 5 MB).
- **110 tests** (`npm test`, con los emuladores corriendo; los 54 de pantalla
  corren solos con `npm run test:ui`): 50 de las reglas de
  Firestore —transiciones de estado, acceso a chats y solicitudes ajenas,
  agregados que el cliente no puede tocar, reseñas, moderación y borrado del
  historial de avisos y los bloqueos entre personas—, 6 del filtro de búsqueda
  por texto y 54 de las pantallas con Testing Library.
- Identidad visual de la marca original (verde `#09bc8a`), iconos de la PWA,
  favicon y aviso de instalación/actualización. El logotipo y la "J" de los
  iconos son SVG vectoriales (`public/img/jobo-logo.svg` y `public/favicon.svg`):
  se trazaron de los PNG chicos que había, sin cambiar el dibujo, así que ya no
  se ven borrosos en pantallas densas. Los PNG de la PWA salen de `favicon.svg`.
- Mientras carga, cada pantalla muestra su propio esqueleto gris con la forma
  del contenido que viene (`src/components/ui/skeletons.tsx`), en vez del
  spinner genérico. El spinner sigue vivo solo en los guardas de ruta, donde
  todavía no se sabe qué pantalla se va a dibujar.
- Las conversaciones de trabajos ya cerrados se pueden eliminar a mano desde la
  casilla. El borrado es de cada uno (`chats.hiddenFor`): sacarla de tu lista no
  se la saca al otro, y si te vuelve a escribir reaparece. Nunca se borra sola.
  El botón aparece según `chats.requestStatus`, que copia el estado de la
  solicitud; los chats creados antes de que ese campo existiera se rellenaron
  con `scripts/backfill-chat-status.mjs`.
- Buscador por texto (nombre, título, descripción y oficio), tolerante a
  acentos y mayúsculas.
- El teléfono marcado como público se muestra en la ficha; lo sincroniza una
  Cloud Function junto con el nombre y la foto.
- La barra de abajo recuerda en `localStorage` si la última sesión de ese
  teléfono ofrecía servicios, para no dibujarse con cuatro pestañas y sumar
  "Mi trabajo" cuando llega el perfil desde Firestore.
- La campana de avisos vive dentro del contenido de cada pantalla —en la home,
  al lado del logo—, así que acompaña el scroll en vez de quedar fija arriba.
- El historial de avisos se puede vaciar desde la propia pantalla.
- **Push verificados en un teléfono Android con la PWA instalada**, de punta a
  punta y con la app cerrada: registro del dispositivo, envío desde el servidor
  y aviso en la barra de notificaciones. Van solo con `data` —si llevan
  `notification`, el SDK dibuja su propio aviso además del que dibuja el
  service worker y se ven dos— y con urgencia alta, porque si no Android los
  demora o los descarta en segundo plano.
- Con los push ya andando, las herramientas de diagnóstico de la pantalla de
  avisos quedaron solo para el admin: el botón que dispara un aviso local
  (distingue "el teléfono los tiene apagados" de "el push no llega") y el panel
  con lo que únicamente se ve desde el propio dispositivo —permiso, service
  worker, suscripción push y si el token de ese equipo está en la cuenta—. Un
  vecino con los avisos activos no ve nada: no hay nada que hacer ahí.

## Salud del código

`AGENTS.md` fija la regla: toda tarea que toque código cierra con
`npx react-doctor@latest --verbose src` en verde. El 2 de septiembre de 2026 se
pasó de **54/100 con 16 hallazgos** a **100/100**: error boundary en las rutas
raíz, el timer de actualización del service worker con su cleanup, el contexto
de auth fuera del archivo del provider, y las tres pantallas más enredadas
(home, panel del profesional y ficha pública) partidas en componentes bajo
`src/features/*/components/`.

## Rumbo a las tiendas

Jobo va a Google Play y App Store envuelta con **Capacitor**. El plan completo,
con el estado de cada tramo, está en `PLAN-TIENDAS.md`; los textos y las
respuestas de los formularios de las tiendas, en `FICHAS-TIENDA.md`.

El `appId` es **`com.jobo.app`** y no se cambia nunca más. `android/` e `ios/`
se versionan. El build nativo va aparte (`npm run build:native`): adentro del
contenedor el service worker de la PWA sobra y puede servir código viejo
cacheado después de una actualización bajada de la tienda.

Probado en un Android real: arranca, la splash se va sola, el botón atrás
navega, el login con Google anda y la bienvenida aparece. Sin probar de punta a
punta: los push con la app cerrada, la cámara y la ubicación. Nunca corrió nada
de iOS.

### Lo que hay que saber para no volver a tropezar

- **Toda pantalla fuera del `AppLayout`** —login, registro, legales— necesita su
  propio `h-full overflow-y-auto`: `html` y `body` tienen `overflow: hidden`
  porque el scroll lo maneja el `<main>` del layout. Y el contenedor que
  scrollea no puede ser el mismo que centra con `justify-center`: en una
  pantalla corta, lo que se pasa por arriba queda inalcanzable.
- **La paleta de marca tiene cinco tonos** (50, 100, 500, 600, 700). Un
  `brand-950` no existe: Tailwind no genera la clase y la regla desaparece sin
  avisar, así que en oscuro queda el fondo claro con el texto claro encima. Lo
  vigila `tests/paletaMarca.test.tsx`.
- **`npm run deploy:hosting`**, nunca `firebase deploy --only hosting` a secas:
  `cap:sync` deja en `dist/` el build nativo, y publicarlo rompe la PWA en
  silencio.
- **Dibujar de punta a punta** trajo tres cosas que no se ven en el navegador:
  el `pb-20` fijo no alcanza para la barra de abajo (de ahí `.pb-nav`), el
  contenido pasa por debajo de la hora al scrollear (de ahí `.status-scrim`), y
  la barra de navegación de Android heredaba el color de los iconos del tema
  `Light` de la aplicación.
- **Al acelerar el ingreso** apareció una carrera vieja: `LoginPage` tiene un
  guarda que saca de ahí a quien ya tiene sesión, y con el perfil llegando
  rápido se disparaba antes de que `run()` eligiera destino. Por eso
  `ingresando` es un estado aparte de `loading`.

### Lo que falta, y todo depende de algo que no está en el repo

1. **Desplegar la web** (`npm run deploy:hosting`). Sin eso, las tres URLs
   legales que van en las fichas —`/privacidad`, `/terminos`,
   `/eliminar-cuenta`— no existen en producción y un revisor ve un 404.
2. **Keystore de release de Android**, fuera del repo y con respaldo. Si se
   pierde no se puede volver a actualizar la app, salvo con Play App Signing.
   Su SHA-1 va cargado en Firebase.
3. **Testing cerrado de Play**: 12 testers, 14 días seguidos.
4. **Cargar profesionales reales.** Si el revisor abre la app y ve la home en
   gris con "sin nadie aún", la rechaza por contenido incompleto. Dejó de ser
   una mejora y pasó a ser un bloqueante.
5. **iOS entero**: Mac o runner macOS, clave APNs, capabilities en Xcode y
   probar Sign in with Apple.
6. **Que un abogado lea** la privacidad y los términos.

## Pendiente para el próximo tramo

El orden de lo que sigue está en `proximas-tareas.md`.

> Al desplegar Cloud Functions por primera vez en un proyecto, las de 2ª
> generación fallan con un error de permisos de Eventarc. No es un problema del
> código: hay que esperar unos minutos y volver a correr el deploy.

### Lo que costó caro una vez

Los push "no funcionaban" y el problema no estaba en el código nuevo: el
teléfono seguía con el **service worker viejo** cacheado, así que ningún
arreglo llegaba a tener efecto. Antes de dar por roto algo del lado del
servidor, confirmá que el dispositivo tenga la versión nueva. La app ahora
busca actualizaciones cada hora y cada vez que vuelve al frente.

Para diagnosticar push, este es el orden que sirvió: ¿hay token en
`users/{uid}.fcmTokens`? → ¿FCM acepta el envío a ese token? → ¿el aviso
local del botón "Probar un aviso" aparece? Cada paso descarta una mitad.

Tercera: un service worker nuevo no reemplaza al viejo hasta que se cierran
todas las pestañas. El de los push ahora hace `skipWaiting()`, pero mientras
no lo tuvo, cada arreglo parecía no funcionar porque en el teléfono seguía
corriendo el de antes.

Y la segunda trampa, peor que la primera: `firebase.json` no tenía el hook
`predeploy` que compila las funciones, así que `firebase deploy --only
functions` decía "Successful update" mientras subía el JavaScript viejo que
hubiera quedado en `functions/lib`. Días de cambios que nunca llegaron a
producción, sin un solo error a la vista. Si tocás algo en `functions/`,
comprobá que el cambio esté en el código compilado, no solo en el fuente.

### Cómo desplegar

```bash
npm run deploy:hosting     # recompila la web y publica
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

**Nunca `firebase deploy --only hosting` a secas.** `npm run cap:sync` deja en
`dist/` el build nativo, que va sin service worker ni manifiesto: publicarlo
deja la PWA sin poder instalarse ni recibir avisos, y no falla ni avisa.

Cuidado con los scripts de `scripts/`: sin `FIRESTORE_EMULATOR_HOST` y
`FIREBASE_AUTH_EMULATOR_HOST` apuntan a **producción**, no al emulador.

### Mejoras que valen la pena después

- Sincronizar también el nombre y la foto dentro de los chats ya abiertos:
  hoy quedan con el valor que tenían al crearse la conversación.
- Historial de reseñas propias y "mis calificaciones" en el perfil.
- Ordenar resultados por cercanía real, no solo por rating.
- Tests de las pantallas que todavía no tienen: chat, detalle de solicitud,
  perfil profesional y panel de admin.
- La búsqueda por texto se hace en memoria sobre los primeros 100 activos de
  la localidad: alcanza para un pueblo, pero no escala a toda la provincia.
- Notificar por email además de push, para quien no instala la PWA.
- Un logo propio, dibujado de cero. Los vectores de hoy son un calco del PNG
  viejo: sirven para que no se vea borroso, pero arrastran las irregularidades
  de un original de 110×44 px.

## Cómo levantar todo

```bash
npm install
npm run dev            # front en http://localhost:5173
npm run emulators      # Auth, Firestore, Storage y Functions
npm test               # tests de las reglas (necesita los emuladores)
```

`VITE_USE_EMULATORS` en `.env.local` decide contra qué corre la app: `true`
usa los emuladores, `false` pega contra el proyecto real. Quedó en `false`.

El watcher de Vite está en modo sondeo porque en WSL2 el nativo no ve los
cambios y el dev server termina sirviendo código viejo. Para desactivarlo,
`VITE_POLL=false npm run dev`.

## Datos de prueba en el emulador

Las cuentas viven solo mientras el emulador esté corriendo:

| Cuenta | Rol en la prueba |
| --- | --- |
| `ana@test.com` / `jobo123456` | profesional (jardinería + electricidad) |
| `pedro@test.com` / `jobo123456` | vecino que pide el presupuesto |
