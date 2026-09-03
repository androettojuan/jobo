/**
 * Arma los archivos fuente de los iconos y la splash de las apps nativas, a
 * partir del mismo SVG del que salen el favicon y los iconos de la PWA.
 *
 *   node scripts/generate-assets.mjs
 *   npx capacitor-assets generate     # reparte los tamaños a android/ e ios/
 *
 * Se generan cinco archivos en `assets/`, y cada uno existe por un motivo:
 *
 * - `icon.png`: sin esquinas redondeadas ni transparencia. El SVG de la marca
 *   trae un `rx` que dejaría las esquinas transparentes, y la App Store
 *   rechaza los iconos con canal alfa. El redondeo lo pone cada sistema.
 * - `icon-foreground.png` / `icon-background.png`: las dos capas del icono
 *   adaptativo de Android, que recorta la capa de adelante con la forma que
 *   elija el lanzador. La "J" queda en el 57% central, dentro de la zona que
 *   ningún recorte se come.
 * - `splash.png` / `splash-dark.png`: cuadradas y grandes, porque la misma
 *   imagen se recorta para todas las orientaciones y densidades.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

import sharp from 'sharp'

const VERDE = '#09bc8a'

// La "J" del favicon. Se toma la ruta, no el archivo entero: el fondo lo pone
// cada composición según lo que necesite.
const favicon = readFileSync('public/favicon.svg', 'utf8')
const jota = /<path[^>]*\bd="([^"]+)"/.exec(favicon)?.[1]
if (!jota) throw new Error('No se encontró la "J" en public/favicon.svg')

/**
 * El centro real del trazo dentro del lienzo de 2048. La "J" no está en el
 * medio: ocupa de (540, 356) a (1512, 1521). Medido con `sharp.trim()`, no a
 * ojo — a ojo el desfase vertical de 86px no se ve y queda torcido igual.
 */
const CX = 1026
const CY = 938.5

const CENTRAR = `translate(${1024 - CX}, ${1024 - CY})`

/**
 * El tamaño va en el propio SVG y no en un `resize` posterior: así el trazo se
 * rasteriza directo a la medida final, sin pasar por una imagen intermedia que
 * después habría que agrandar o achicar.
 */
const svg = (contenido, lado) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" ` +
      `width="${lado}" height="${lado}">${contenido}</svg>`,
  )

const fondo = `<rect width="2048" height="2048" fill="${VERDE}"/>`
const marca = (transform) =>
  `<g transform="${transform}"><path fill="#fff" fill-rule="evenodd" d="${jota}"/></g>`

// `plano` aplasta el canal alfa contra el verde. Aunque el fondo ya sea
// opaco, un PNG rasterizado desde SVG sale con canal alfa igual, y la App
// Store rechaza los iconos que lo tienen. La capa de adelante del icono
// adaptativo es la excepción: ahí la transparencia es el punto.
const piezas = [
  { nombre: 'icon.png', lado: 1024, plano: true, contenido: fondo + marca(CENTRAR) },
  { nombre: 'icon-foreground.png', lado: 1024, contenido: marca(CENTRAR) },
  { nombre: 'icon-background.png', lado: 1024, plano: true, contenido: fondo },
  // En la splash la marca va chica: la pantalla es enorme y un logo estirado
  // de lado a lado se ve mal en cualquier tamaño.
  {
    nombre: 'splash.png',
    lado: 2732,
    plano: true,
    contenido: fondo + marca(`translate(1024, 1024) scale(0.42) translate(${-CX}, ${-CY})`),
  },
]
// El tema oscuro usa el mismo verde: es el color de la marca, no del tema, y
// dos splash distintas harían que la app arranque de dos maneras.
piezas.push({ ...piezas.at(-1), nombre: 'splash-dark.png' })

mkdirSync('assets', { recursive: true })

for (const { nombre, lado, contenido, plano } of piezas) {
  const imagen = sharp(svg(contenido, lado))
  const png = await (plano ? imagen.flatten({ background: VERDE }) : imagen).png().toBuffer()
  writeFileSync(`assets/${nombre}`, png)
  console.log(`assets/${nombre} — ${lado}×${lado}, ${(png.length / 1024).toFixed(0)} KB`)
}
