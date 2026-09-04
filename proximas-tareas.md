# Próximas tareas

Anotado el 3 de septiembre de 2026, al cierre del día. El detalle de cada
cosa está en `PLAN-TIENDAS.md`; los textos de las tiendas, en
`FICHAS-TIENDA.md`.

## 1. Desplegar la web — 2 minutos, y desbloquea todo lo demás

```bash
npm run deploy:hosting
```

La web en producción es del 2 de septiembre: no tiene el borrado de cuenta, ni
el bloqueo, ni las páginas legales, ni la pregunta del registro.

**Es lo primero porque bloquea la publicación**, no solo porque la web esté
vieja: las tres URLs que van en las fichas de las dos tiendas
—`/privacidad`, `/terminos`, `/eliminar-cuenta`— hoy no existen en producción.
El build viejo manda cualquier ruta desconocida a "Página no encontrada", así
que un revisor que abra la política de privacidad ve un 404. Eso es rechazo
directo.

Después del deploy, dos cosas esperables: a quien tenga la PWA instalada le va
a aparecer el cartel de versión nueva, y los tokens de push se re-registran con
la forma nueva. El backfill ya corrió, así que no van a quedar duplicados.

## 2. Cargar profesionales reales

El riesgo de rechazo más concreto que hay hoy, y no es técnico. Si el revisor
abre la app y ve la home en gris con "sin nadie aún" en todos los rubros, la
rechaza por contenido incompleto (Apple 2.1, y Play por calidad mínima).

Dejó de ser una mejora y pasó a ser un bloqueante.

De paso hace falta armar la **cuenta de prueba para los revisores**: email y
contraseña —no Google, que el revisor no puede usar—, con perfil completo,
perfil profesional activo, una solicitud en curso, un chat con mensajes y una
reseña recibida.

## 3. Keystore de release de Android

```bash
keytool -genkeypair -v -keystore jobo-release.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias jobo
```

Guardalo **fuera del repo y con respaldo**: si se pierde no se puede volver a
publicar una actualización de la app nunca más, salvo que esté activado Play
App Signing —que conviene activar justamente por eso—. El `.gitignore` ya
ignora `*.jks`, `*.keystore` y `android/keystore.properties`.

Con el keystore hecho, pasame su SHA-1 y lo cargo en Firebase:

```bash
keytool -list -v -keystore jobo-release.jks -alias jobo | grep SHA1
```

Sin esa huella, el login con Google falla en el build firmado con un error que
no dice nada. Hay que sumar también la que agrega Play App Signing, que aparece
en la consola de Play recién después de subir el primer AAB.

## 4. Subir a testing cerrado de Play

Las cuentas personales nuevas necesitan **12 testers durante 14 días seguidos**
antes de poder pasar a producción. Conviene arrancarlo apenas haya un AAB
firmado, aunque falten pulidos: esos 14 días corren en paralelo con el resto
del trabajo.

## 5. iOS, cuando haya Mac

Nada de iOS corrió nunca. Está escrito pero sin ejecutar:

- Agregar la app iOS en Firebase, bajar `GoogleService-Info.plist` a
  `ios/App/App/` y subir la clave APNs (`.p8`). Sin la clave, los push no
  llegan y fallan en silencio.
- Habilitar el proveedor Apple en *Authentication → Sign-in method* y la
  capability en Xcode.
- Probar Sign in with Apple de verdad, sobre todo que el nombre se guarde: Apple
  lo manda **una sola vez**, en el primer login.

## 6. Que un abogado lea la privacidad y los términos

Lo que hay describe con precisión lo que la app hace, pero no es una opinión
legal.

---

## Sin probar de punta a punta

Anda, pero nadie lo ejercitó completo en un teléfono:

- **Push con la app cerrada.** El servidor ya manda el formato nuevo. Falta
  confirmar que el aviso salta con la "J" verde y que al tocarlo abre el chat.
- **Cámara y ubicación.** Sacar una foto de perfil y usar "Detectar".
- **Borrado de cuenta contra producción.** Probado contra los emuladores con 19
  comprobaciones, nunca contra datos reales. Usá una cuenta descartable.
- **La tarjeta de disponibilidad del panel**, que necesita una cuenta con perfil
  profesional.

## Mejoras que quedaron anotadas, sin urgencia

- Aviso por email al admin cuando entra una denuncia. Los términos prometen
  mirarlas dentro de las 24 horas y hoy solo queda una línea en los logs.
- Un modo vacaciones con fecha de vuelta, como el de Mercado Libre. Hoy el
  interruptor es manual en las dos direcciones.
- Sincronizar nombre y foto dentro de los chats ya abiertos.
- Ordenar resultados por cercanía real, no solo por rating.
- La búsqueda por texto se hace en memoria sobre los primeros 100 activos de la
  localidad: alcanza para un pueblo, no para una provincia.
- Un logo dibujado de cero. Los vectores de hoy son un calco de un PNG de
  110×44 px.
