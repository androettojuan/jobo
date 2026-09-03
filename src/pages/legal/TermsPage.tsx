import { Link } from 'react-router-dom'

import { LegalPage } from '@/components/LegalPage'
import { CONTACTO, EDAD_MINIMA } from '@/lib/contacto'

export function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones" updatedAt="3 de septiembre de 2026">
      <p>Al usar Jobo aceptás esto. Es corto a propósito.</p>

      <h2>Qué es Jobo y qué no</h2>
      <p>
        Jobo es un <strong>tablón de anuncios</strong>: te pone en contacto con profesionales de tu
        zona. No somos parte del trabajo que contratás, no lo hacemos nosotros, no cobramos por él y
        no lo garantizamos. El precio, la forma de pago, los plazos y el resultado se arreglan entre
        vos y la otra persona. No empleamos a los profesionales ni los representamos.
      </p>
      <p>
        Tampoco verificamos matrículas, seguros ni habilitaciones. La tilde de "verificado" quiere
        decir que revisamos que la persona sea quien dice ser, no que avalemos su trabajo. Fijate
        vos que quien contratás esté en condiciones de hacer lo que le pedís.
      </p>

      <h2>Tu cuenta</h2>
      <ul>
        <li>Tenés que tener {EDAD_MINIMA} años o más.</li>
        <li>Los datos que cargás tienen que ser tuyos y ciertos. Nada de perfiles falsos.</li>
        <li>Una persona, una cuenta. La misma cuenta sirve para contratar y para ofrecer.</li>
        <li>Sos responsable de lo que se haga desde tu cuenta.</li>
      </ul>

      <h2>Lo que publicás</h2>
      <p>
        Los textos, las fotos y las reseñas que subís son tuyos y seguís siendo el dueño. Nos das
        permiso para mostrarlos dentro de Jobo, que es para lo que los subiste.
      </p>
      <p>No se puede publicar:</p>
      <ul>
        <li>Insultos, amenazas, acoso ni contenido que discrimine a nadie.</li>
        <li>Contenido sexual, violento o ilegal.</li>
        <li>Fotos o datos de otras personas sin su permiso.</li>
        <li>Spam, estafas, promesas falsas o precios que no son los reales.</li>
        <li>
          Reseñas compradas, propias o de allegados, ni reseñas de trabajos que no existieron.
        </li>
      </ul>

      <h2>Denunciar</h2>
      <p>
        Si alguien se pasa, podés <strong>denunciarlo</strong> desde su perfil o desde la reseña.
        Revisamos las denuncias y, si corresponde, ocultamos el contenido o suspendemos la cuenta.
        Nos comprometemos a mirar cada denuncia dentro de las 24 horas.
      </p>

      <h2>Podemos suspender cuentas</h2>
      <p>
        Si rompés estas reglas, podemos ocultar lo que publicaste, pausar tu perfil profesional o
        cerrarte la cuenta, sin aviso previo si el caso es grave. Vos podés irte cuando quieras
        borrando tu cuenta desde <Link to="/perfil">Mi perfil</Link>.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        Jobo se ofrece tal como está. Hacemos lo posible para que funcione, pero no prometemos que
        esté disponible sin interrupciones ni que la información que cargan otras personas sea
        exacta. No respondemos por daños derivados de un trabajo contratado a través de la app: eso
        es entre las partes. Nada de esto limita los derechos que la ley argentina te da como
        consumidor.
      </p>

      <h2>Ley aplicable</h2>
      <p>Se aplica la ley argentina y son competentes los tribunales de la Provincia de Córdoba.</p>

      <h2>Cambios y contacto</h2>
      <p>
        Si esto cambia, se actualiza la fecha de arriba y lo avisamos en la app. Cómo tratamos tus
        datos está en la <Link to="/privacidad">política de privacidad</Link>. Cualquier cosa:{' '}
        <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
      </p>
    </LegalPage>
  )
}
