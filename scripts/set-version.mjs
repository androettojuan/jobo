/**
 * Pone la misma versión en los tres lugares donde vive.
 *
 *   node scripts/set-version.mjs 1.0.0        # sube el build en uno
 *   node scripts/set-version.mjs 1.0.0 --build 7
 *
 * A mano se desincronizan solo, y cada tienda castiga distinto: Google Play
 * rechaza un AAB cuyo `versionCode` ya se subió alguna vez, y App Store
 * Connect hace lo mismo con `CURRENT_PROJECT_VERSION`. El número de build
 * nunca baja ni se repite, aunque la versión visible no cambie.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [version, ...resto] = process.argv.slice(2)
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('Uso: node scripts/set-version.mjs <mayor.menor.parche> [--build N]')
  process.exit(1)
}

const GRADLE = 'android/app/build.gradle'
const PBXPROJ = 'ios/App/App.xcodeproj/project.pbxproj'
const PACKAGE = 'package.json'

const gradle = readFileSync(GRADLE, 'utf8')
const buildActual = Number(/versionCode (\d+)/.exec(gradle)[1])

const indice = resto.indexOf('--build')
const build = indice === -1 ? buildActual + 1 : Number(resto[indice + 1])
if (!Number.isInteger(build) || build < 1) {
  console.error('El número de build tiene que ser un entero positivo.')
  process.exit(1)
}
// Solo se frena si baja. Repetir el número sirve para volver a correr el
// script sin efecto, y si ese build ya se subió a una tienda lo va a rechazar
// ella: desde acá no hay forma de saber qué se publicó y qué no.
if (build < buildActual) {
  console.error(`El build ${build} es menor que el actual (${buildActual}). Las tiendas no aceptan que baje.`)
  process.exit(1)
}

const paquete = JSON.parse(readFileSync(PACKAGE, 'utf8'))
paquete.version = version
writeFileSync(PACKAGE, `${JSON.stringify(paquete, null, 2)}\n`)

writeFileSync(
  GRADLE,
  gradle
    .replace(/versionCode \d+/, `versionCode ${build}`)
    .replace(/versionName "[^"]*"/, `versionName "${version}"`),
)

writeFileSync(
  PBXPROJ,
  readFileSync(PBXPROJ, 'utf8')
    .replaceAll(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${build};`)
    .replaceAll(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`),
)

console.log(`Versión ${version}, build ${build}, en package.json, Android e iOS.`)
