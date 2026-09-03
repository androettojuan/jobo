import { Link } from 'react-router-dom'

import { LegalPage } from '@/components/LegalPage'
import { CONTACTO } from '@/lib/contacto'

/**
 * Página pública de borrado de cuenta.
 *
 * Google Play exige una URL donde se pueda pedir el borrado **sin instalar la
 * app**, además del botón que está adentro. Esta es esa URL: se declara en la
 * ficha de Play y tiene que poder abrirse sin sesión.
 */
export function DeleteAccountInfoPage() {
  return (
    <LegalPage title="Eliminar mi cuenta de Jobo" updatedAt="3 de septiembre de 2026">
      <h2>Desde la app o desde la web</h2>
      <p>
        Entrá a <Link to="/perfil">Mi perfil</Link>, bajá hasta el final y tocá{' '}
        <strong>Eliminar mi cuenta</strong>. Te va a pedir que escribas ELIMINAR para confirmar. Es
        inmediato y no se puede deshacer.
      </p>

      <h2>Si no podés entrar</h2>
      <p>
        Escribinos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> desde la misma dirección de email
        con la que te registraste, pidiendo que borremos la cuenta. Lo hacemos dentro de los 30 días
        y te confirmamos por email cuando esté. Si escribís desde otra dirección vamos a pedirte
        alguna forma de comprobar que la cuenta es tuya: es la única manera de no borrarle la cuenta
        a alguien por pedido de un tercero.
      </p>

      <h2>Qué se borra</h2>
      <ul>
        <li>Tu perfil: nombre, email, teléfono, localidad y foto.</li>
        <li>Tu perfil profesional, con sus oficios, precios, fotos y calificaciones recibidas.</li>
        <li>Tu historial de avisos y tus favoritos.</li>
        <li>Las fotos que subiste a tu perfil.</li>
        <li>Tu cuenta de acceso: no vas a poder volver a entrar con ella.</li>
      </ul>

      <h2>Qué queda, y por qué</h2>
      <p>
        Los chats, las reseñas que escribiste y las solicitudes ya cerradas quedan{' '}
        <strong>sin tu nombre ni tu foto</strong>, como "Usuario eliminado". No son solo tuyos:
        borrarlos le sacaría a la otra persona un historial que también es suyo, y a un profesional
        le cambiaría el promedio de calificaciones por algo que no hizo. Las solicitudes que estén
        abiertas se cancelan y se le avisa al otro.
      </p>
      <p>
        Las denuncias que hayas hecho se conservan sin tu identidad, para que la moderación pueda
        seguir un caso que quizá afecte a otras personas.
      </p>

      <h2>Cuánto tarda</h2>
      <p>
        Desde la app, en el momento. Por email, hasta 30 días. Después de eso no queda ninguna
        copia: no tenemos respaldos de largo plazo con datos personales.
      </p>
      <p>
        Más detalle en la <Link to="/privacidad">política de privacidad</Link>.
      </p>
    </LegalPage>
  )
}
