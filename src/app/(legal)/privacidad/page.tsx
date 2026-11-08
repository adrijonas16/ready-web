import Link from 'next/link';
import Documento from '@/components/legal/Documento';
import Contacto from '@/components/legal/Contacto';
import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Política de privacidad',
  descripcion: 'Cómo Ready trata tus datos personales según la Ley N.° 29733 y su reglamento: qué datos recogemos, para qué, con quién los compartimos y cómo ejercer tus derechos.',
  ruta: '/privacidad',
});

const INDICE: [string, string][] = [
  ['responsable', 'Quién es responsable'],
  ['datos', 'Qué datos recogemos'],
  ['menores', 'Datos de alumnos (menores de edad)'],
  ['finalidades', 'Para qué los usamos'],
  ['base-legal', 'Base legal y consentimiento'],
  ['encargados', 'Con quién los compartimos'],
  ['transferencias', 'Transferencias internacionales'],
  ['conservacion', 'Cuánto tiempo los guardamos'],
  ['derechos', 'Tus derechos y cómo ejercerlos'],
  ['cookies', 'Cookies'],
  ['seguridad', 'Seguridad'],
  ['cambios', 'Cambios a esta política'],
  ['contacto', 'Contacto'],
];

export default function Privacidad() {
  return (
    <Documento ruta="/privacidad" titulo="Política de privacidad" actualizado="7 de noviembre de 2026" indice={INDICE}
      intro={<p>Te contamos, en lenguaje claro, qué datos tuyos usamos para preparar tu pedido de útiles escolares, por qué y qué puedes hacer con ellos.</p>}>
      <p>
        Esta política se rige por la <strong>Ley N.° 29733, Ley de Protección de Datos Personales</strong>, y su reglamento aprobado por el{' '}
        <strong>Decreto Supremo N.° 016-2024-JUS</strong>, que reemplazó al reglamento anterior (D.S. N.° 003-2013-JUS). La autoridad competente es la{' '}
        <strong>Autoridad Nacional de Protección de Datos Personales (ANPD)</strong> del Ministerio de Justicia y Derechos Humanos.
      </p>
      <p>
        <strong>Importante:</strong> Ready funciona hoy como tienda de demostración. En la demo, los datos que escribes se guardan solo en tu
        navegador (no se envían a un servidor), los pagos son simulados y no se entrega ningún producto.
      </p>

      <h2 id="responsable">1. Quién es responsable de tus datos</h2>
      <p>
        El titular del banco de datos y responsable del tratamiento es <strong>[razón social]</strong>, con RUC <strong>[número]</strong> y domicilio en{' '}
        <strong>[dirección], Arequipa, Perú</strong>, que opera la tienda con el nombre comercial <span translate="no">Ready</span>.
        Banco de datos de clientes inscrito en el Registro Nacional de Protección de Datos Personales: <strong>[código de inscripción, por completar]</strong>.
      </p>

      <h2 id="datos">2. Qué datos recogemos</h2>
      <table>
        <thead><tr><th scope="col">Dato</th><th scope="col">Cuándo</th></tr></thead>
        <tbody>
          <tr><td>Nombre, correo electrónico y contraseña (cifrada)</td><td>Al crear tu cuenta o iniciar sesión.</td></tr>
          <tr><td>Teléfono</td><td>En tu perfil o al pagar, para coordinar la entrega.</td></tr>
          <tr><td>Dirección de entrega, referencia y ubicación en el mapa (GPS)</td><td>Al pagar. La ubicación solo se toma si marcas el punto en el mapa o permites que el navegador la comparta.</td></tr>
          <tr><td>DNI o RUC, y razón social</td><td>Solo si pides boleta con documento o factura (comprobante de pago).</td></tr>
          <tr><td>Fotos de listas de útiles</td><td>Cuando subes la lista de tu colegio. Pueden incluir el nombre del colegio, el grado y, a veces, el nombre del alumno.</td></tr>
          <tr><td>Nombres de alumnos para etiquetas y carátulas</td><td>Si pides etiquetas o carátulas personalizadas, o indicas para quién es cada lista.</td></tr>
          <tr><td>Pedidos, pagos y reclamos</td><td>Productos, montos, método de pago elegido (no guardamos números de tarjeta), historial y hojas del Libro de Reclamaciones.</td></tr>
          <tr><td>Datos técnicos y de uso</td><td>Preferencias guardadas en tu navegador y, solo si lo aceptas, estadísticas de visitas (ver <a href="#cookies">Cookies</a>).</td></tr>
        </tbody>
      </table>
      <p>No pedimos datos sensibles. Te pedimos no escribir en notas ni fotos información de salud u otra que no sea necesaria para el pedido.</p>

      <h2 id="menores">3. Datos de alumnos (menores de edad)</h2>
      <p>
        La tienda está dirigida a <strong>madres, padres y apoderados mayores de edad</strong>. Los nombres de alumnos, grados y colegios los
        ingresa el adulto que compra, que declara ejercer la patria potestad o la tutela, o contar con la autorización de quien la ejerce. El reglamento
        exige ese consentimiento para tratar datos de menores, salvo los mayores de 14 años que pueden darlo directamente cuando la información
        se les ofrece en un lenguaje que puedan entender.
      </p>
      <p>
        Usamos esos datos solo para armar y rotular el pedido (etiquetas, carátulas, separar las listas por hijo) y no los usamos para publicidad ni
        para perfiles. Puedes pedir que los borremos cuando ya no los necesites.
      </p>

      <h2 id="finalidades">4. Para qué usamos tus datos</h2>
      <ul>
        <li><strong>Atender tu pedido:</strong> leer tu lista, cotizar, preparar, cobrar, entregar en Arequipa y emitir el comprobante.</li>
        <li><strong>Gestionar tu cuenta:</strong> iniciar sesión, guardar listas y mostrar tus pedidos.</li>
        <li><strong>Comunicarnos contigo sobre tu pedido:</strong> avisos de estado por la web, WhatsApp o teléfono.</li>
        <li><strong>Atender reclamos y quejas</strong> del Libro de Reclamaciones y cumplir obligaciones legales y tributarias.</li>
        <li><strong>Mejorar la tienda</strong> con estadísticas de uso agregadas, solo si aceptas las cookies de analítica.</li>
        <li><strong>Publicidad o promociones:</strong> solo si nos das un consentimiento aparte y expreso. Hoy no enviamos publicidad.</li>
      </ul>

      <h2 id="base-legal">5. Base legal y consentimiento</h2>
      <p>
        Tratamos tus datos porque son necesarios para <strong>ejecutar la compra</strong> que nos pides, para <strong>cumplir obligaciones legales</strong>{' '}
        (comprobantes, Libro de Reclamaciones) y, en lo demás, con tu <strong>consentimiento</strong> libre, previo, expreso, informado e inequívoco,
        que das al aceptar esta política, al subir una foto o al activar la analítica. Puedes retirar tu consentimiento en cualquier momento,
        sin efecto retroactivo.
      </p>

      <h2 id="encargados">6. Con quién compartimos tus datos</h2>
      <p>No vendemos tus datos. Los comparten solo los proveedores que nos ayudan a operar (encargados del tratamiento), bajo contrato y para nuestros fines:</p>
      <ul>
        <li><strong>Alojamiento web:</strong> Vercel Inc. (Estados Unidos), que sirve la página.</li>
        <li><strong>Servidor y base de datos:</strong> [proveedor de hosting de la API y la base de datos, por completar], donde se guardan cuentas, listas y pedidos.</li>
        <li><strong>Lectura de listas con inteligencia artificial:</strong> [proveedor de IA, por completar], que recibe la foto de la lista solo para transcribir los útiles. Una persona del equipo revisa siempre el resultado.</li>
        <li><strong>Analítica:</strong> Google Analytics 4 (Google LLC), solo si aceptas las cookies de analítica, sin datos que te identifiquen directamente.</li>
        <li><strong>Reparto y pagos:</strong> [empresa de reparto y pasarela de pago, por completar], con los datos mínimos para entregar o cobrar.</li>
        <li><strong>Autoridades</strong> (SUNAT, Indecopi, ANPD, Poder Judicial) cuando la ley lo exija.</li>
      </ul>

      <h2 id="transferencias">7. Transferencias internacionales</h2>
      <p>
        Algunos proveedores (alojamiento, IA, analítica) procesan datos fuera del Perú, principalmente en Estados Unidos. Solo trabajamos con
        proveedores de países con un nivel de protección adecuado o que se obligan por contrato (cláusulas contractuales) a proteger tus datos
        con garantías equivalentes a las de la ley peruana.
      </p>

      <h2 id="conservacion">8. Cuánto tiempo guardamos tus datos</h2>
      <ul>
        <li><strong>Cuenta:</strong> mientras esté activa; si la eliminas, borramos o anonimizamos tus datos, salvo lo que debamos conservar por ley.</li>
        <li><strong>Pedidos y comprobantes:</strong> el plazo que exigen las normas tributarias y contables.</li>
        <li><strong>Hojas de reclamación:</strong> al menos dos años desde su registro, como exige el Reglamento del Libro de Reclamaciones.</li>
        <li><strong>Fotos de listas y nombres de alumnos:</strong> hasta el fin de la campaña escolar del pedido, o antes si nos lo pides.</li>
        <li><strong>Datos de la demo:</strong> quedan en tu navegador hasta que uses «Reiniciar la demo» o borres los datos del sitio.</li>
      </ul>

      <h2 id="derechos">9. Tus derechos y cómo ejercerlos</h2>
      <p>Como titular de tus datos puedes ejercer, de forma gratuita:</p>
      <ul>
        <li><strong>Acceso:</strong> saber qué datos tuyos tenemos y cómo los usamos. Incluye pedir una copia en un formato estructurado y de uso común (portabilidad).</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos. Muchos los puedes cambiar tú mismo en <Link href="/profile">Mi perfil</Link>.</li>
        <li><strong>Cancelación (supresión):</strong> pedir que eliminemos tus datos cuando ya no sean necesarios.</li>
        <li><strong>Oposición:</strong> oponerte a un uso concreto por un motivo legítimo.</li>
        <li>También puedes <strong>revocar tu consentimiento</strong> y pedir información sobre los encargados y las transferencias.</li>
      </ul>
      <p>
        Escríbenos por los medios de la sección <a href="#contacto">Contacto</a> indicando tu nombre, el derecho que quieres ejercer, el correo de tu
        cuenta y una copia de tu documento de identidad (o el poder de tu representante). Responderemos dentro de los plazos que fija el reglamento.
        Si no estás conforme con la respuesta, puedes presentar una reclamación ante la <strong>ANPD</strong>.
      </p>

      <h2 id="cookies">10. Cookies y almacenamiento local</h2>
      <p>
        Usamos almacenamiento del navegador necesario para que la tienda funcione y, solo con tu permiso, cookies de analítica. Los detalles están en la{' '}
        <Link href="/cookies">Política de cookies</Link>, desde donde también puedes cambiar tus preferencias.
      </p>

      <h2 id="seguridad">11. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables: conexión cifrada (HTTPS), contraseñas cifradas, acceso restringido al personal que lo
        necesita y cabeceras de seguridad en la web. Si ocurriera un incidente de seguridad que afecte tus datos, lo comunicaremos a la ANPD y a las
        personas afectadas, en lenguaje claro y en los plazos del reglamento (como regla general, dentro de las 48 horas de conocerlo).
      </p>

      <h2 id="cambios">12. Cambios a esta política</h2>
      <p>
        Si cambiamos esta política publicaremos la nueva versión aquí, con su fecha. Si el cambio afecta finalidades para las que diste tu consentimiento,
        te lo pediremos de nuevo.
      </p>

      <h2 id="contacto">13. Contacto</h2>
      <p>Para cualquier consulta sobre tus datos o para ejercer tus derechos:</p>
      <Contacto />
      <p>Si tu consulta es un reclamo sobre un pedido, también puedes usar el <Link href="/libro-de-reclamaciones">Libro de Reclamaciones</Link>.</p>
    </Documento>
  );
}
