# Estado del proyecto

Registro para retomar el trabajo más adelante.
Última actualización: **29 de agosto de 2026**.

## Dónde estamos

Reescritura de `jobo-next-2` (Next 14 + JSX + API en localhost:8080) como PWA
mobile-first con **Vite + React + TypeScript + Firebase**. El repo viejo queda
intacto como referencia; este proyecto no depende de él.

Proyecto Firebase: **`jobo-8b688`**. Reglas de Firestore y Storage e índices ya
desplegados. Las Cloud Functions todavía **no** se desplegaron a producción
(sí funcionan en emuladores).

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

## Pendiente para el próximo tramo

Por orden sugerido:

1. **Habilitar Email/Contraseña en la consola de Firebase.**
   Authentication → Sign-in method. Hoy está deshabilitado: el registro con
   email falla con `OPERATION_NOT_ALLOWED` (Google sí anda).
2. **Hacerte admin.** Bajar la clave de servicio y correr
   `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin.mjs juan.androetto36@gmail.com`.
   Después cerrar y volver a abrir sesión.
3. **Cargar el catálogo en Firestore**: `npm run seed` (mismas credenciales).
4. **Desplegar las Cloud Functions**: `cd functions && npm run deploy`.
   Requiere plan Blaze. Sin esto no hay ratings agregados, contadores ni push.
5. **Clave VAPID** para push web: Firebase Console → Cloud Messaging →
   certificados push web → completar `VITE_FIREBASE_VAPID_KEY` en `.env.local`.
6. **Deploy del front**: `npm run build && firebase deploy --only hosting`.

### Mejoras que valen la pena después

- Historial de reseñas propias y "mis calificaciones" en el perfil.
- Búsqueda por texto libre (hoy solo por categoría y localidad).
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

Para desarrollar contra los emuladores, poner `VITE_USE_EMULATORS=true` en
`.env.local` (así quedó configurado). Para pegarle a producción, ponerlo en
`false`.

## Datos de prueba en el emulador

Las cuentas viven solo mientras el emulador esté corriendo:

| Cuenta | Rol en la prueba |
| --- | --- |
| `ana@test.com` / `jobo123456` | profesional (jardinería + electricidad) |
| `pedro@test.com` / `jobo123456` | vecino que pide el presupuesto |
