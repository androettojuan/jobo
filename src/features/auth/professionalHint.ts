const KEY = 'jobo:is-professional'

/**
 * Si la última sesión en este dispositivo ofrecía servicios.
 *
 * El perfil viene de Firestore y tarda, así que en el primer pintado todavía
 * no se sabe si va la pestaña "Mi trabajo": la barra salía con cuatro iconos y
 * pasaba a cinco a los pocos milisegundos. Con esto arranca bien, salvo la
 * primera vez que se entra desde ese teléfono.
 */
export function readProfessionalHint() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue sin la pista.
    return false
  }
}

export function writeProfessionalHint(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? '1' : '0')
  } catch {
    // No pasa nada: solo vuelve el parpadeo de la barra.
  }
}
