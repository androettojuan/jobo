/**
 * Baja el catálogo de localidades de la API Georef (Ministerio del Interior,
 * sobre datos de INDEC, IGN y BAHRA) y lo deja en el formato que usa la app.
 *
 *   node scripts/fetch-localities.mjs                    # todo el país
 *   node scripts/fetch-localities.mjs cordoba santa-fe   # solo esas provincias
 *
 * Escribe por salida estándar, para no pisar el catálogo por accidente:
 *
 *   node scripts/fetch-localities.mjs > src/lib/data/localities.json
 *
 * Los ids son slugs de nombre + provincia (`villa-rumipal-cordoba`), salvo las
 * ocho localidades del catálogo original, que conservan el slug corto que ya
 * quedó guardado en Firestore. Si esos ids cambiaran, los perfiles y las
 * solicitudes existentes dejarían de casar con el catálogo.
 *
 * La API es pública, gratuita y sin credenciales: https://apis.datos.gob.ar/georef/
 */
const API = 'https://apis.datos.gob.ar/georef/api/localidades'
const CAMPOS = 'id,nombre,provincia.nombre,centroide.lat,centroide.lon'

const provincias = process.argv.slice(2)

/**
 * Las ocho del catálogo de Calamuchita, que salieron a producción con el slug
 * corto. Se respeta el id viejo para no tener que migrar lo ya guardado.
 */
const IDS_HISTORICOS = new Map([
  ['villa-rumipal-cordoba', 'villa-rumipal'],
  ['embalse-cordoba', 'embalse'],
  ['villa-del-dique-cordoba', 'villa-del-dique'],
  ['santa-rosa-de-calamuchita-cordoba', 'santa-rosa-de-calamuchita'],
  ['villa-general-belgrano-cordoba', 'villa-general-belgrano'],
  ['los-reartes-cordoba', 'los-reartes'],
  ['la-cruz-cordoba', 'la-cruz'],
  ['san-agustin-cordoba', 'san-agustin'],
])

const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function fetchPage(provincia, inicio) {
  const url = new URL(API)
  url.searchParams.set('campos', CAMPOS)
  url.searchParams.set('max', '5000')
  url.searchParams.set('inicio', String(inicio))
  if (provincia) url.searchParams.set('provincia', provincia)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Georef respondió ${res.status} para ${url}`)
  return res.json()
}

/** Trae todas las páginas: la API corta en 5000 por pedido. */
async function fetchAll(provincia) {
  const out = []
  let inicio = 0
  for (;;) {
    const page = await fetchPage(provincia, inicio)
    out.push(...page.localidades)
    inicio += page.cantidad
    if (out.length >= page.total || page.cantidad === 0) return out
  }
}

const crudas = provincias.length
  ? (await Promise.all(provincias.map(fetchAll))).flat()
  : await fetchAll(null)

const vistos = new Map()

const localidades = crudas
  .map((l) => {
    const base = `${slug(l.nombre)}-${slug(l.provincia.nombre)}`
    // Hay nombres repetidos dentro de una misma provincia; el número de
    // Georef desempata y mantiene el id estable entre corridas.
    const repetido = vistos.get(base)
    vistos.set(base, (repetido ?? 0) + 1)
    const unico = repetido === undefined ? base : `${base}-${l.id}`

    return {
      id: IDS_HISTORICOS.get(unico) ?? unico,
      name: l.nombre,
      province: l.provincia.nombre,
      // Cuatro decimales son ~11 metros: de sobra para adivinar el pueblo más
      // cercano, y recorta a la mitad el peso del archivo.
      lat: Number(l.centroide.lat.toFixed(4)),
      lng: Number(l.centroide.lon.toFixed(4)),
    }
  })
  .sort((a, b) => a.province.localeCompare(b.province, 'es') || a.name.localeCompare(b.name, 'es'))

// Formato compacto: con 4000 entradas, repetir las claves en cada objeto suma
// 180 KB de nada. `src/lib/localities.ts` lo vuelve a expandir.
const provinciasUnicas = [...new Set(localidades.map((l) => l.province))].sort((a, b) =>
  a.localeCompare(b, 'es'),
)
const indice = new Map(provinciasUnicas.map((p, i) => [p, i]))

process.stdout.write(
  JSON.stringify({
    provinces: provinciasUnicas,
    localities: localidades.map((l) => [l.id, l.name, indice.get(l.province), l.lat, l.lng]),
  }) + '\n',
)
process.stderr.write(`${localidades.length} localidades en ${provinciasUnicas.length} provincias\n`)
