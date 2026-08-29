/**
 * Otorga (o quita) el rol de super admin a una cuenta.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     node scripts/set-admin.mjs juan.androetto36@gmail.com
 *
 * La clave de servicio se baja de: Firebase Console > Configuración del
 * proyecto > Cuentas de servicio > Generar nueva clave privada.
 * NO la commitees.
 */
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'node:fs'

const email = process.argv[2]
const revoke = process.argv.includes('--revoke')

if (!email) {
  console.error('Uso: node scripts/set-admin.mjs <email> [--revoke]')
  process.exit(1)
}

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!credentialsPath) {
  console.error('Falta GOOGLE_APPLICATION_CREDENTIALS apuntando al service-account.json')
  process.exit(1)
}

initializeApp({ credential: cert(JSON.parse(readFileSync(credentialsPath, 'utf8'))) })

const auth = getAuth()
const user = await auth.getUserByEmail(email)
await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true })

console.log(
  revoke
    ? `Rol de admin quitado a ${email} (${user.uid}).`
    : `${email} (${user.uid}) ahora es super admin. Tiene que cerrar y volver a abrir sesión.`,
)
