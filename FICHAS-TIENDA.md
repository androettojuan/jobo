# Fichas de Google Play y App Store

Textos y respuestas listas para copiar a las consolas. Salen del modelo de
datos real, no de una plantilla: si algo cambia en la app, esto se actualiza.

Lo que hay acá **no** reemplaza revisar la ficha antes de mandar. Y las
respuestas de privacidad son declaraciones formales: si declarás de menos, la
tienda lo trata como una violación, no como un error.

---

## Textos

### Nombre

**Jobo** (10 caracteres; Play permite 30, Apple 30).

### Subtítulo — solo App Store (30 caracteres)

> Oficios de tu pueblo

### Descripción corta — solo Play (80 caracteres)

> Encontrá plomeros, electricistas y más profesionales de tu pueblo o ciudad.

(74 caracteres.)

### Descripción larga

```
Jobo conecta a quien necesita resolver algo —una canilla que pierde, una
instalación eléctrica, un flete— con profesionales de su propio pueblo o
ciudad.

CÓMO FUNCIONA

Elegí tu localidad y buscá por oficio o escribiendo lo que necesitás. Vas a ver
quién trabaja cerca tuyo, con sus calificaciones y sus precios de referencia.

Mandale una solicitud de presupuesto con fotos del problema. Si la acepta, se
abre el chat y recién ahí se comparten los teléfonos. Cuando el trabajo se
termina, lo calificás.

UNA SOLA CUENTA

La misma cuenta sirve para contratar y para ofrecer servicios. Un plomero puede
contratar un electricista sin tener que registrarse dos veces. Si querés
trabajar, activás tu perfil profesional, elegís hasta cinco oficios y las zonas
donde te movés, y lo pausás cuando no estés disponible.

DE TU ZONA, DE VERDAD

Jobo cubre las 4037 localidades del país. Buscás en la tuya, no en "Capital y
alrededores". Guardamos el nombre del pueblo, nunca tu ubicación exacta: el
botón "Detectar" usa el GPS en el momento para adivinar cuál te queda más
cerca, y listo.

CON QUIÉN ESTÁS HABLANDO

Las calificaciones salen de trabajos que existieron: solo se puede calificar
una solicitud completada, y una sola vez. El profesional tiene derecho a
responder. Podés denunciar a quien se pase de la raya y bloquearlo para que no
te escriba más.

Jobo es gratis. No cobramos comisión por los trabajos ni tenemos publicidad.
```

### Palabras clave — solo App Store (100 caracteres, separadas por coma)

```
plomero,electricista,albañil,gasista,oficios,changas,servicios,técnico,pintor,cerrajero,presupuesto
```

(99 caracteres. No repitas "Jobo" ni el nombre de la categoría: Apple ya indexa
el nombre de la app, y repetir gasta lugar.)

### Categoría

- **Play**: Estilo de vida. (La alternativa es Negocios; Estilo de vida encaja
  mejor con quien busca resolver algo en su casa.)
- **App Store**: Estilo de vida, secundaria Utilidades.

### País y idioma

Argentina, español (Argentina) como idioma principal.

### Contacto

- Email de soporte: `juan.androetto36@gmail.com` (el mismo de
  `src/lib/contacto.ts`).
- Política de privacidad: `https://jobo-8b688.web.app/privacidad`
- Términos: `https://jobo-8b688.web.app/terminos`
- Borrado de cuenta: `https://jobo-8b688.web.app/eliminar-cuenta`

> Si en algún momento hay dominio propio, estas tres URLs cambian y hay que
> actualizarlas en las dos consolas.

---

## Clasificación de edad

**17+ en App Store, PEGI 12 / "Apto para mayores de 13" en Play.**

El motivo es el mismo en las dos: hay **chat libre entre usuarios** y
**contenido generado por usuarios sin moderación previa**. No hay violencia, ni
sexo, ni juego, ni alcohol. Al llenar los cuestionarios:

- ¿La app permite a los usuarios comunicarse entre sí? **Sí.**
- ¿Permite compartir contenido generado por el usuario? **Sí** (fotos, textos,
  reseñas).
- ¿Comparte la ubicación del usuario con otros? **No.** Se muestra la localidad
  elegida, que es un pueblo, no una posición.
- ¿Hay compras dentro de la app? **No.**

Los términos piden 18 años (se contrata y se paga por trabajos), pero la
clasificación de tienda mide el contenido, no las condiciones del servicio.

---

## Play — Formulario de Seguridad de los datos

**¿Se recopilan datos?** Sí. **¿Se cifran en tránsito?** Sí (todo va por HTTPS
contra Firebase). **¿Se pueden borrar?** Sí, desde la app y por la URL pública.

| Tipo de dato | ¿Se recopila? | ¿Se comparte? | ¿Obligatorio? | Finalidad |
| --- | --- | --- | --- | --- |
| Nombre | Sí | No | Sí | Funciones de la app |
| Email | Sí | No | Sí | Funciones de la app, gestión de la cuenta |
| Teléfono | Sí | No | No | Funciones de la app |
| Dirección aproximada (localidad) | Sí | No | No | Funciones de la app |
| Fotos | Sí | No | No | Funciones de la app |
| Mensajes en la app | Sí | No | No | Funciones de la app |
| Otras acciones del usuario | Sí | No | No | Funciones de la app |
| ID de dispositivo | Sí | No | No | Funciones de la app |

Aclaraciones que conviene tener a mano por si preguntan:

- **"¿Se comparte?" es No en todo.** Firebase es un proveedor que procesa por
  cuenta nuestra, y Play no cuenta eso como compartir con terceros.
- **La ubicación es aproximada, nunca precisa.** El manifiesto declara
  `ACCESS_COARSE_LOCATION` y no la fina, justamente para no tener que
  justificar la precisa.
- **El ID de dispositivo** es el token de Cloud Messaging, y se usa solo para
  entregar los avisos.
- **No hay publicidad, analítica de terceros ni venta de datos.**

---

## App Store — Etiquetas de privacidad

Tres bloques. Todo lo que Jobo recolecta cae en el primero: **vinculado con el
usuario, sin seguimiento**.

**Datos vinculados con vos** (finalidad: *Funcionalidad de la app* en todos):

- Información de contacto: nombre, email, teléfono
- Ubicación: ubicación aproximada
- Contenido del usuario: fotos, mensajes, otro contenido (reseñas, solicitudes)
- Identificadores: ID de usuario, ID de dispositivo

**Datos no vinculados con vos**: ninguno.

**Datos usados para rastrearte**: **ninguno**. Esto importa: al declararlo así,
la app **no** tiene que mostrar el diálogo de App Tracking Transparency.

---

## Material gráfico

| Pieza | Dónde | Medida |
| --- | --- | --- |
| Icono | Play | 512×512 PNG, 32 bits |
| Icono | App Store | 1024×1024 PNG, **sin alfa ni esquinas redondeadas** |
| Gráfico destacado | Play | 1024×500 |
| Capturas de teléfono | Play | mínimo 2, entre 320 y 3840 px de lado |
| Capturas | App Store | 6.9" y 6.5" obligatorias |

Los iconos ya están generados (`node scripts/generate-assets.mjs`): el de Play
sale de `assets/icon.png` y el de Apple ya viaja en
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

**No declares compatibilidad con iPad.** El proyecto está en
`TARGETED_DEVICE_FAMILY = "1"` a propósito: si decís que anda en iPad, Apple lo
prueba ahí, y la app es mobile-only.

### Qué mostrar en las capturas

Cinco, en este orden, que es el recorrido real de alguien que necesita algo:

1. La home con una localidad elegida y la grilla de oficios.
2. Resultados de una búsqueda, con calificaciones a la vista.
3. La ficha de un profesional.
4. El formulario de solicitud de presupuesto con una foto.
5. El chat.

**Ninguna captura puede tener datos reales de nadie.** Nombres y fotos
inventados.

---

## Cuenta de prueba para los revisores

Apple la exige y Play la agradece. Hay que dejar una cuenta de email y
contraseña —no de Google, que el revisor no puede usar— con:

- perfil completo, con foto y localidad;
- perfil profesional activo, con oficios y precios;
- al menos una solicitud en curso y un chat con mensajes;
- una reseña recibida.

> **El riesgo más concreto de rechazo hoy no es técnico.** Si el revisor abre
> la app y ve la home en gris con "sin nadie aún" en todos los rubros, la
> rechaza por contenido incompleto (Apple 2.1, y Play por calidad mínima).
> Cargar profesionales reales antes de mandar a revisión no es opcional.

---

## Notas de la versión 1.0.0

```
Primera versión de Jobo como app.

Todo lo que ya andaba en la web, ahora con cámara, ubicación y avisos del
sistema.
```
