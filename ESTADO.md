# Estado del proyecto

Registro para retomar el trabajo más adelante.
Última actualización: **29 de agosto de 2026**.

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
  GPS solo en el momento para adivinar el pueblo más cercano del catálogo.
  Arranca por el Valle de Calamuchita.
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
- **42 tests** (`npm test`, con los emuladores corriendo): 36 de las reglas de
  Firestore —transiciones de estado, acceso a chats y solicitudes ajenas,
  agregados que el cliente no puede tocar, reseñas, moderación y borrado del
  historial de avisos— y 6 del filtro de búsqueda por texto.
- Identidad visual de la marca original (verde `#09bc8a`), iconos de la PWA,
  favicon y aviso de instalación/actualización.
- Buscador por texto (nombre, título, descripción y oficio), tolerante a
  acentos y mayúsculas.
- El teléfono marcado como público se muestra en la ficha; lo sincroniza una
  Cloud Function junto con el nombre y la foto.
- La campana de avisos vive dentro del contenido de cada pantalla —en la home,
  al lado del logo—, así que acompaña el scroll en vez de quedar fija arriba.
- El historial de avisos se puede vaciar desde la propia pantalla.

## Pendiente para el próximo tramo

1. **Probar los push en un teléfono real.** Es lo único sin verificar. Si algo
   falla, la pantalla de avisos ahora dice cuál de los cuatro casos es
   (permiso denegado, navegador sin soporte, falta la clave VAPID, error
   técnico) en vez de culpar siempre al permiso.

> Al desplegar Cloud Functions por primera vez en un proyecto, las de 2ª
> generación fallan con un error de permisos de Eventarc. No es un problema del
> código: hay que esperar unos minutos y volver a correr el deploy.

### Cómo desplegar

```bash
npm run build && firebase deploy --only hosting
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

Cuidado con los scripts de `scripts/`: sin `FIRESTORE_EMULATOR_HOST` y
`FIREBASE_AUTH_EMULATOR_HOST` apuntan a **producción**, no al emulador.

### Mejoras que valen la pena después

- Sincronizar también el nombre y la foto dentro de los chats ya abiertos:
  hoy quedan con el valor que tenían al crearse la conversación.
- Historial de reseñas propias y "mis calificaciones" en el perfil.
- Ordenar resultados por cercanía real, no solo por rating.
- Ampliar el catálogo de localidades más allá de Calamuchita.
- Tests de los flujos de la app (hoy solo están cubiertas las reglas y el
  filtro de búsqueda).
- La búsqueda por texto se hace en memoria sobre los primeros 100 activos de
  la localidad: alcanza para un pueblo, pero no escala a toda la provincia.
- Notificar por email además de push, para quien no instala la PWA.
- Un logo propio en SVG: los iconos actuales se generaron a partir del PNG
  viejo (`scripts/` no los versiona, están en `public/`).

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
