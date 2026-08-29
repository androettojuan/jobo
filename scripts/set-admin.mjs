/**
 * Otorga (o quita) el rol de super admin a una cuenta.
 *
 *   node scripts/set-admin.mjs juan.androetto36@gmail.com
 *   node scripts/set-admin.mjs juan.androetto36@gmail.com --revoke
 *
 * La cuenta tiene que existir en Firebase Auth: quien la use debe haber
 * iniciado sesión en la app al menos una vez.
 */
import { getAuth } from 'firebase-admin/auth'

import { initAdmin } from './admin-app.mjs'

const email = process.argv[2]
const revoke = process.argv.includes('--revoke')

if (!email) {
  console.error('Uso: node scripts/set-admin.mjs <email> [--revoke]')
  process.exit(1)
}

initAdmin()

const auth = getAuth()

let user
try {
  user = await auth.getUserByEmail(email)
} catch {
  console.error(
    `No existe ninguna cuenta con ${email}.\n` +
      'Iniciá sesión una vez en la app con esa cuenta y volvé a correr esto.',
  )
  process.exit(1)
}

await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true })

console.log(
  revoke
    ? `Rol de admin quitado a ${email} (${user.uid}).`
    : `${email} (${user.uid}) ahora es super admin. Cerrá y volvé a abrir sesión para que el token traiga el permiso.`,
)
