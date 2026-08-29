# Estado del proyecto

Registro para retomar el trabajo más adelante.
Última actualización: **29 de agosto de 2026**.

## Dónde estamos

Reescritura de `jobo-next-2` (Next 14 + JSX + API en localhost:8080) como PWA
mobile-first con **Vite + React + TypeScript + Firebase**. El repo viejo queda
intacto como referencia; este proyecto no depende de él.

Proyecto Firebase: **`jobo-8b688`**, en plan Blaze. Ya están en producción las
reglas de Firestore y Storage, los índices, el catálogo (32 oficios y 8
localidades) y las 11 Cloud Functions. El login por email y por Google está
habilitado. Verificado end to end contra producción: registro, perfil
profesional y recálculo de contadores por la función en la nube.

## Decisiones tomadas

- **Cuenta única.** Todos se registran igual; quien quiere ofrecer servicios
  activa su perfil profesional. Un plomero puede contratar un electricista.
- **Hasta 5 oficios por profesional**, y el chat recuerda por cuál lo
  contactaron.
- **Ubicación por localidad, nunca GPS preciso.** El botón "Detectar" usa el
  GPS solo en el momento para adivinar el pueblo más cercano del catálogo.
  Arranca por el Valle de Calamuchita.
- **La solicitud es el hilo conductor**: habilita el chat, libera el teléfono
  al aceptarse y, al completarse, habilita la reseña (una por solicitud).
- **Los agregados los escriben Cloud Functions**, nunca el cliente
  (`ratingAvg`, `unreadCount`, `stats/categories`, `completedJobs`).
- **Admin por custom claim** de Firebase Auth, no por un campo en Firestore.
- Solo vista móvil por ahora; no se prioriza desktop.

## Hecho y verificado

Probado de punta a punta contra los emuladores (registro → perfil profesional →
solicitud → chat → estados → reseña → rating recalculado):

- Auth con email y con Google; perfil de usuario editable (nombre, teléfono con
  visibilidad configurable, localidad, foto).
- Perfil profesional: oficios, zonas de trabajo, precios, fotos, pausar/activar.
- Búsqueda por categoría y localidad; home por rubros con contador de
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
- **32 tests de las reglas de Firestore** (`npm test`, con los emuladores
  corriendo): transiciones de estado, acceso a chats y solicitudes ajenas,
  agregados que el cliente no puede tocar, reseñas y moderación.
- Identidad visual de la marca original (verde `#09bc8a`), iconos de la PWA,
  favicon y aviso de instalación/actualización.
- Buscador por texto (nombre, título, descripción y oficio), tolerante a
  acentos y mayúsculas.
- El teléfono marcado como público se muestra en la ficha; lo sincroniza una
  Cloud Function junto con el nombre y la foto.

## Pendiente para el próximo tramo

1. **Hacerte admin.** Requiere que la cuenta exista en Auth: iniciá sesión una
   vez en la app con `juan.androetto36@gmail.com` y después corré
   `npm run admin juan.androetto36@gmail.com`. Cerrá y volvé a abrir sesión
   para que el token traiga el permiso; el panel queda en `/admin`.
2. **Clave VAPID** para push web: Firebase Console → Cloud Messaging →
   certificados push web → completar `VITE_FIREBASE_VAPID_KEY` en `.env.local`.
   Sin esto las notificaciones push no se registran (el resto de la app anda).
3. **Deploy del front**: `npm run build && firebase deploy --only hosting`.

> Al desplegar Cloud Functions por primera vez en un proyecto, las de 2ª
> generación fallan con un error de permisos de Eventarc. No es un problema del
> código: hay que esperar unos minutos y volver a correr el deploy.

### Mejoras que valen la pena después

- Sincronizar también el nombre y la foto dentro de los chats ya abiertos:
  hoy quedan con el valor que tenían al crearse la conversación.

- Historial de reseñas propias y "mis calificaciones" en el perfil.
- Ordenar resultados por cercanía real, no solo por rating.
- Ampliar el catálogo de localidades más allá de Calamuchita.
- Tests de los flujos de la app (hoy solo están cubiertas las reglas).
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
