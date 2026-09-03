/**
 * Lo que este teléfono recuerda de la última sesión.
 *
 * Firebase tarda unos milisegundos en decir si hay sesión, y Firestore un poco
 * más en traer el perfil. En ese hueco la pantalla no puede quedarse en blanco,
 * pero tampoco puede dibujar el estado "todavía no sé" como si fuera real: eso
 * es lo que hace que la app parpadee al abrirla. Con estas pistas arranca
 * mostrando lo mismo que la última vez, y cuando llega el dato de verdad casi
 * nunca cambia nada.
 *
 * Son pistas, no autoridad: nada que dependa de ellas puede tener consecuencias
 * (los permisos los deciden las reglas de Firestore, no esto). Si la sesión
 * caducó, la pista se corrige sola al primer `onAuthStateChanged`.
 */
const KEYS = {
  professional: 'jobo:is-professional',
  signedIn: 'jobo:signed-in',
}

function read(key: string) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue sin la pista.
    return false
  }
}

function write(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // No pasa nada: solo vuelve el parpadeo.
  }
}

/** Si la última sesión en este dispositivo ofrecía servicios. */
export const readProfessionalHint = () => read(KEYS.professional)
export const writeProfessionalHint = (value: boolean) => write(KEYS.professional, value)

/**
 * Si la última vez que se abrió la app había sesión iniciada.
 *
 * Sin esto, la home dibuja "Iniciar sesión" arriba a la derecha y lo cambia
 * por la campana un instante después, en cada arranque.
 */
export const readSignedInHint = () => read(KEYS.signedIn)
export const writeSignedInHint = (value: boolean) => write(KEYS.signedIn, value)
