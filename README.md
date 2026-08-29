# Jobo

App para conectar personas que necesitan resolver un problema (una canilla que
pierde, una instalación eléctrica) con profesionales de su pueblo o ciudad.

Reescritura del prototipo `jobo-next-2` con **Vite + React + TypeScript +
Firebase**, pensada como **PWA mobile-first**.

## Stack

| Pieza | Elección |
| --- | --- |
| Build | Vite 8 + React 19 + TypeScript strict |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router (`createBrowserRouter`) |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions, FCM |
| Estado | Contexto para la sesión, Zustand para la localidad elegida |
| PWA | `vite-plugin-pwa` |

## Decisiones de diseño

- **Cuenta única.** Todos se registran igual; quien quiere ofrecer servicios
  activa un perfil profesional (`professionals/{uid}`). Así un plomero puede
  contratar un electricista sin tener dos cuentas.
- **Ubicación por localidad, no por GPS.** Guardamos el pueblo/ciudad
  (`localities`), nunca coordenadas de nadie. El botón "Detectar" usa el GPS
  solo en el momento para adivinar la localidad más cercana del catálogo.
- **La solicitud es el hilo conductor.** `requests` habilita el chat, el
  intercambio de teléfono y, al completarse, la reseña. Una reseña por
  solicitud completada: el id de la reseña ES el id de la solicitud.
- **Los agregados no los escribe el cliente.** `ratingAvg`, `ratingCount`,
  `unreadCount` y los contadores de `stats/categories` los mantienen Cloud
  Functions; las reglas de seguridad bloquean su escritura desde la app.
- **Admin por custom claim.** El rol vive en el token de Firebase Auth, no en
  Firestore, para que nadie pueda dárselo a sí mismo editando su documento.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con las credenciales del proyecto
npm run dev
```

Scripts:

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run typecheck` — chequeo de tipos
- `npm test` — tests de las reglas de Firestore (requiere los emuladores)
- `npm run seed` — carga oficios y localidades en Firestore
- `npm run emulators` — emuladores de Firebase
- `npm run deploy:rules` — publica reglas e índices de Firestore y Storage

### Hacerte super admin

```bash
npm run admin juan.androetto36@gmail.com
```

Usa las credenciales que ya dejó `firebase login` (o
`gcloud auth application-default login`); también acepta un
`GOOGLE_APPLICATION_CREDENTIALS` si preferís una clave de servicio.

La cuenta tiene que existir: iniciá sesión una vez en la app antes de correrlo.
Después hay que cerrar y volver a abrir sesión para que el token traiga el
permiso. El panel queda en `/admin`.

## Estructura

```
src/
  app/          router, layout con barra inferior, guards de ruta
  components/   UI compartida (Button, Input, EmptyState…)
  features/     auth, professionals, requests, chat, reviews, admin, localities
  lib/          firebase, catálogo de categorías y localidades, utils
  types/        modelo de datos de Firestore
```
