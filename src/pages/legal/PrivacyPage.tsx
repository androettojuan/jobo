import { Link } from 'react-router-dom'

import { LegalPage } from '@/components/LegalPage'
import { CONTACTO } from '@/lib/contacto'

export function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" updatedAt="3 de septiembre de 2026">
      <p>
        Jobo conecta a quien necesita resolver algo con profesionales de su pueblo o ciudad. Para
        que eso funcione hace falta guardar algunos datos tuyos. Acá está exactamente cuáles, para
        qué, con quién se comparten y cómo los borrás.
      </p>

      <h2>Qué guardamos</h2>
      <ul>
        <li>
          <strong>Tu cuenta:</strong> nombre, email y, si entrás con Google o con Apple, lo que esos
          servicios nos devuelven (nombre, email y foto). Si usás Apple y elegís esconder tu email,
          recibimos una dirección de reenvío y nunca la real.
        </li>
        <li>
          <strong>Tu perfil:</strong> foto, localidad y —si querés— tu teléfono. Vos decidís si se
          muestra a cualquiera o solo a quien ya tiene una solicitud aceptada con vos.
        </li>
        <li>
          <strong>Si ofrecés servicios:</strong> tus oficios, las zonas donde trabajás, tus precios
          de referencia y las fotos de trabajos que subas.
        </li>
        <li>
          <strong>Lo que pasa en la app:</strong> las solicitudes de presupuesto que mandás o
          recibís (título, descripción, fotos, fecha propuesta), los mensajes y fotos de los chats,
          las reseñas que escribís o recibís y las denuncias que hacés.
        </li>
        <li>
          <strong>Tu dispositivo:</strong> un identificador que Google Cloud Messaging le asigna,
          para poder mandarte los avisos. No es tu número de teléfono ni nada que te identifique
          fuera de Jobo.
        </li>
      </ul>

      <h2>Tu ubicación</h2>
      <p>
        <strong>No guardamos tus coordenadas.</strong> Cuando tocás "Detectar", el sistema nos pasa
        tu posición aproximada una única vez, la usamos ahí mismo para adivinar cuál de las 4037
        localidades del país te queda más cerca, y se descarta. Lo que queda guardado es el nombre
        del pueblo, igual que si lo hubieras elegido a mano. Podés corregirlo cuando quieras, y
        podés usar Jobo sin darnos acceso a la ubicación nunca.
      </p>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Mostrarte profesionales de tu zona y mostrarte a vos, si ofrecés servicios.</li>
        <li>Hacer andar las solicitudes, el chat y las reseñas.</li>
        <li>Avisarte cuando alguien te escribe, te contrata o te califica.</li>
        <li>Moderar: revisar denuncias, verificar profesionales y suspender cuentas abusivas.</li>
      </ul>
      <p>
        No vendemos tus datos, no los cedemos a anunciantes y no los usamos para publicidad. Jobo no
        tiene avisos.
      </p>

      <h2>Quién más los ve</h2>
      <p>
        Jobo funciona sobre <strong>Firebase</strong>, de Google LLC: ahí viven la autenticación, la
        base de datos, las fotos y el envío de avisos. Eso implica que Google procesa esos datos
        como proveedor nuestro, y que pueden estar alojados fuera de la Argentina. Su política está
        en <a href="https://firebase.google.com/support/privacy">firebase.google.com</a>. No hay
        otros terceros: no usamos analítica de terceros ni redes publicitarias.
      </p>
      <p>
        Lo que sí ven otras personas es lo que vos publicás: tu nombre y tu foto, tu perfil
        profesional si lo activaste, y tu teléfono solo según la opción que hayas elegido.
      </p>

      <h2>Cuánto tiempo</h2>
      <p>
        Mientras tengas cuenta. Cuando la borrás, se borra tu perfil, tus fotos, tus avisos y tu
        perfil profesional con sus calificaciones. Los chats, las reseñas que escribiste y las
        solicitudes cerradas quedan <strong>sin tu nombre ni tu foto</strong>: son de a dos, y
        borrarlos le sacaría a la otra persona un historial que también es suyo.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés ver y corregir tus datos desde <Link to="/perfil">Mi perfil</Link>, y borrar tu cuenta
        desde ahí mismo o pidiéndolo por escrito (ver{' '}
        <Link to="/eliminar-cuenta">Eliminar mi cuenta</Link>). Por la Ley 25.326 de Protección de
        Datos Personales tenés derecho a acceder, rectificar y suprimir tus datos, y la Agencia de
        Acceso a la Información Pública es el organismo de control ante el que podés reclamar.
      </p>

      <h2>Menores</h2>
      <p>
        Jobo es para mayores de 18 años: se contrata y se cobra por trabajos. No pedimos datos a
        menores a propósito; si nos enteramos de una cuenta de alguien menor de esa edad, la
        borramos.
      </p>

      <h2>Cambios</h2>
      <p>
        Si esto cambia, se actualiza la fecha de arriba y lo avisamos dentro de la app. Dudas o
        reclamos: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
      </p>
    </LegalPage>
  )
}
