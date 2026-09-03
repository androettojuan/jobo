import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * La paleta de marca tiene solo algunos tonos. Si alguien escribe
 * `bg-brand-950`, Tailwind no genera la clase y la regla **desaparece sin
 * avisar**: en modo claro no se nota, y en oscuro queda el fondo claro con el
 * texto claro encima, ilegible.
 *
 * No lo agarra ni el typecheck ni el lint ni react-doctor, así que lo agarra
 * esto. Si hace falta un tono nuevo, se define en `index.css`.
 */
function tonosDefinidos() {
  const css = readFileSync('src/index.css', 'utf8')
  return new Set([...css.matchAll(/--color-brand-(\d+):/g)].map((m) => m[1]))
}

function archivosFuente(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta)
    return /\.(tsx?|css)$/.test(nombre) ? [ruta] : []
  })
}

describe('paleta de marca', () => {
  it('todos los tonos usados están definidos', () => {
    const definidos = tonosDefinidos()
    expect(definidos.size).toBeGreaterThan(0)

    const inventados: string[] = []
    // `index.css` queda afuera: ahí se definen los tonos, y el comentario que
    // explica esta trampa nombra los que no existen.
    for (const ruta of archivosFuente('src').filter((r) => !r.endsWith('index.css'))) {
      const contenido = readFileSync(ruta, 'utf8')
      for (const [, tono] of contenido.matchAll(/\bbrand-(\d+)\b/g)) {
        if (!definidos.has(tono)) inventados.push(`${ruta}: brand-${tono}`)
      }
    }

    expect(inventados).toEqual([])
  })
})
