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
 * OJO antes de reemplazar el catálogo: el `id` que genera este script es el de
 * Georef (numérico y estable), y los documentos que ya están en Firestore
 * guardan los ids viejos con forma de slug (`villa-rumipal`). Cambiarlos pide
 * una migración de `users.locality`, `professionals.serviceAreaIds` y
 * `requests.locality`, o el catálogo deja de casar con lo guardado.
 *
 * La API es pública, gratuita y sin credenciales: https://apis.datos.gob.ar/georef/
 */
const API = 'https://apis.datos.gob.ar/georef/api/localidades'
const CAMPOS = 'id,nombre,provincia.nombre,centroide.lat,centroide.lon'

const provincias = process.argv.slice(2)

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

const localidades = crudas
  .map((l) => ({
    id: l.id,
    name: l.nombre,
    province: l.provincia.nombre,
    // Cuatro decimales son ~11 metros: de sobra para adivinar el pueblo más
    // cercano, y recorta a la mitad el peso del archivo.
    lat: Number(l.centroide.lat.toFixed(4)),
    lng: Number(l.centroide.lon.toFixed(4)),
  }))
  .sort((a, b) => a.province.localeCompare(b.province, 'es') || a.name.localeCompare(b.name, 'es'))

process.stdout.write(JSON.stringify(localidades, null, 2) + '\n')
process.stderr.write(`${localidades.length} localidades\n`)
