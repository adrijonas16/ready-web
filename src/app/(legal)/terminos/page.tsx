import Link from 'next/link';
import Documento from '@/components/legal/Documento';
import Contacto from '@/components/legal/Contacto';
import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Términos y condiciones',
  descripcion: 'Condiciones de compra en Ready: precios en soles con IGV, pagos, entrega en Arequipa, cambios y devoluciones, listas leídas con IA y Libro de Reclamaciones.',
  ruta: '/terminos',
});

const INDICE: [string, string][] = [
  ['aceptacion', 'Aceptación y uso del sitio'],
  ['cuenta', 'Tu cuenta'],
  ['precios', 'Precios, IGV y ofertas'],
  ['cotizar', 'Productos por cotizar'],
  ['ia', 'Listas leídas con IA'],
  ['pago', 'Pago y comprobantes'],
  ['entrega', 'Entrega en Arequipa'],
  ['cambios', 'Cambios y devoluciones'],
  ['desistimiento', 'Desistimiento y cancelación'],
  ['propiedad', 'Propiedad intelectual'],
  ['responsabilidad', 'Responsabilidad'],
  ['reclamos', 'Libro de Reclamaciones'],
  ['ley', 'Ley aplicable y jurisdicción'],
];

export default function Terminos() {
  return (
    <Documento ruta="/terminos" titulo="Términos y condiciones" actualizado="7 de noviembre de 2026" indice={INDICE}
      intro={<p>Estas son las reglas para comprar útiles escolares en <span translate="no">Ready</span>. Las escribimos para que se entiendan sin ser abogado.</p>}>
      <p>
        <strong>Tienda de demostración:</strong> mientras Ready funcione en modo demo, los productos, colegios, precios y pagos son de prueba,
        no se cobra nada y no se entregan pedidos. Las condiciones de abajo describen cómo funcionaría la tienda real.
      </p>

      <h2 id="aceptacion">1. Aceptación y uso del sitio</h2>
      <p>
        El sitio lo opera <strong>[razón social]</strong>, RUC <strong>[número]</strong>, con domicilio en <strong>[dirección], Arequipa, Perú</strong> («Ready»).
        Al crear una cuenta o hacer un pedido aceptas estos términos y la <Link href="/privacidad">Política de privacidad</Link>. Te comprometes a usar el sitio de
        buena fe: sin suplantar a otras personas, sin subir contenido ajeno a una lista de útiles y sin intentar afectar su funcionamiento.
      </p>

      <h2 id="cuenta">2. Tu cuenta</h2>
      <p>
        Debes ser mayor de edad para crear una cuenta y comprar. Eres responsable de que tus datos sean correctos y de cuidar tu contraseña.
        Si notas un uso no autorizado, avísanos. Podemos suspender cuentas que incumplan estos términos.
      </p>

      <h2 id="precios">3. Precios, IGV y ofertas</h2>
      <ul>
        <li>Los precios están en <strong>soles (S/)</strong> e <strong>incluyen el IGV</strong>. El costo de envío se muestra aparte antes de pagar.</li>
        <li>El precio que vale es el que ves en el resumen al confirmar el pedido.</li>
        <li>Las ofertas y cupones indican su vigencia y condiciones; valen hasta su fecha de fin o hasta agotar el stock informado, y no son acumulables salvo que se diga lo contrario.</li>
        <li>Si por un error evidente un precio se publica muy por debajo de su valor real, te avisaremos antes de cobrar para que decidas si mantienes el pedido; si ya pagaste y no lo aceptas, te devolvemos todo.</li>
      </ul>

      <h2 id="cotizar">4. Productos por cotizar</h2>
      <p>
        Algunos ítems de una lista (por ejemplo, libros o útiles que no tenemos en el catálogo) aparecen como <strong>«por cotizar»</strong>. No se cobran al
        hacer el pedido: te enviamos el precio y solo se agregan si los apruebas.
      </p>

      <h2 id="ia">5. Listas leídas con inteligencia artificial</h2>
      <p>
        Cuando subes la foto de una lista, un sistema de inteligencia artificial transcribe los útiles y una persona de nuestro equipo
        <strong> revisa el resultado</strong> antes de publicarlo. Aun así, pueden quedar diferencias con la lista original: revisa cantidades, marcas
        y especificaciones antes de pagar. Si un error nuestro de lectura hace que recibas algo distinto a lo pedido, lo cambiamos sin costo.
      </p>

      <h2 id="pago">6. Pago y comprobantes</h2>
      <p>
        Los métodos de pago disponibles se muestran al pagar. <strong>En la demo, el pago es simulado</strong> y no se pide ni guarda ningún dato de tarjeta.
        En la tienda real, el pago lo procesa una pasarela autorizada y Ready no almacena los datos completos de tus tarjetas.
        Emitimos <strong>boleta o factura electrónica</strong> según lo que elijas; para factura necesitas un RUC válido.
      </p>

      <h2 id="entrega">7. Entrega en Arequipa</h2>
      <ul>
        <li>Entregamos en la ciudad de Arequipa, en las zonas que se muestran al pagar.</li>
        <li>Eliges la fecha y la franja horaria entre las disponibles; el plazo mínimo y el costo de envío se indican antes de confirmar.</li>
        <li>Si no hay nadie para recibir el pedido, te contactamos para reprogramar. Una segunda visita puede tener costo.</li>
        <li>Revisa el pedido al recibirlo. Si falta algo o llega dañado, avísanos dentro de las 48 horas.</li>
      </ul>

      <h2 id="cambios">8. Cambios y devoluciones</h2>
      <ul>
        <li><strong>Producto defectuoso, equivocado o incompleto:</strong> lo cambiamos, completamos o te devolvemos el dinero, a tu elección, sin costo de envío. Esto no limita los derechos que te da el Código de Protección y Defensa del Consumidor (Ley N.° 29571).</li>
        <li><strong>Cambio por gusto:</strong> aceptamos cambios de productos sin usar, con su empaque y etiquetas, dentro de los 7 días calendario desde la entrega.</li>
        <li>No aplican cambios por gusto a productos personalizados (etiquetas o carátulas con nombre, forrado) ni a productos abiertos por razones de higiene.</li>
        <li>La devolución de dinero se hace por el mismo medio de pago, en cuanto recibamos y revisemos el producto.</li>
      </ul>

      <h2 id="desistimiento">9. Desistimiento y cancelación</h2>
      <p>
        Puedes <strong>cancelar tu pedido sin costo</strong> mientras esté en estado «Recibido» (antes de que empecemos a prepararlo), desde{' '}
        <Link href="/my-lists">Mis listas y pedidos</Link>. Una vez enviado, aplica la política de cambios y devoluciones. Si una norma te reconoce un derecho de
        desistimiento o restitución en un caso concreto, lo respetaremos en los términos que esa norma establezca.
      </p>

      <h2 id="propiedad">10. Propiedad intelectual</h2>
      <p>
        La marca <span translate="no">Ready</span>, el diseño, los textos y las ilustraciones del sitio nos pertenecen o los usamos con permiso. Las marcas de los
        productos pertenecen a sus fabricantes. Las fotos de listas que subes siguen siendo tuyas o de tu colegio: nos das permiso solo para usarlas
        en la preparación de tu pedido y, si es una lista oficial, para ofrecerla a otras familias del mismo colegio y grado sin datos de tu hijo.
      </p>

      <h2 id="responsabilidad">11. Responsabilidad</h2>
      <p>
        Respondemos por la idoneidad de los productos y servicios que vendemos, conforme a la ley. No respondemos por demoras causadas por caso
        fortuito o fuerza mayor (por ejemplo, cortes de vías), aunque te avisaremos y te daremos la opción de reprogramar o cancelar. No somos
        responsables por cambios que el colegio haga a su lista después de tu pedido.
      </p>

      <h2 id="reclamos">12. Libro de Reclamaciones</h2>
      <p>
        Conforme al Código de Protección y Defensa del Consumidor, contamos con un <Link href="/libro-de-reclamaciones">Libro de Reclamaciones virtual</Link>.
        Responderemos tu reclamo o queja en un plazo no mayor de <strong>15 días hábiles</strong>. Presentar un reclamo no te impide acudir a otras vías
        de solución de controversias ni denunciar ante el Indecopi.
      </p>

      <h2 id="ley">13. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se someterá a los jueces y tribunales de Arequipa,
        sin perjuicio de tu derecho a acudir al Indecopi o a otras vías que te reconozca la ley como consumidor.
      </p>

      <h2 id="contacto">Contacto</h2>
      <Contacto />
    </Documento>
  );
}
