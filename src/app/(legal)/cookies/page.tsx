import Link from 'next/link';
import Documento from '@/components/legal/Documento';
import BotonPreferencias from '@/components/legal/BotonPreferencias';
import { metadatosPagina } from '@/lib/sitio';

export const metadata = metadatosPagina({
  titulo: 'Política de cookies',
  descripcion: 'Qué guarda Ready en tu navegador (carrito, sesión, tema) y qué cookies de analítica usamos solo con tu permiso. Cambia tus preferencias cuando quieras.',
  ruta: '/cookies',
});

const NECESARIAS: [string, string, string][] = [
  ['cart, cart_extra', 'Productos de tu carrito, notas por cotizar y listas de origen.', 'Hasta que vacíes el carrito'],
  ['token, user', 'Tu sesión iniciada y datos básicos de tu cuenta (nombre, correo, rol).', 'Hasta que cierres sesión'],
  ['ready-avisos-…', 'Avisos de estado de tus pedidos ya vistos.', 'Hasta que los borres'],
  ['ready-tema', 'Tema claro, oscuro o del sistema.', 'Indefinida'],
  ['ready-copias', 'Relación entre una lista del colegio y tus copias editadas.', 'Indefinida'],
  ['ready-demo-v1', 'Datos de la tienda de demostración (productos, listas, pedidos de prueba).', 'Hasta «Reiniciar la demo»'],
  ['ready-cookies', 'Tu elección sobre cookies, con versión y fecha.', 'Hasta que la cambies'],
];

export default function Cookies() {
  return (
    <Documento ruta="/cookies" titulo="Política de cookies" actualizado="7 de noviembre de 2026"
      intro={<p>Qué guardamos en tu navegador, para qué y cómo cambiar tu elección.</p>}>
      <p>
        Una <strong>cookie</strong> es un pequeño archivo que un sitio guarda en tu navegador. El <strong>almacenamiento local</strong> (localStorage) es
        parecido, pero no se envía al servidor en cada visita. Como pueden servir para identificarte, la normativa peruana de protección de datos los
        trata como datos personales: por eso usamos solo los necesarios y pedimos tu permiso para los demás, que quedan desactivados hasta que los aceptes.
      </p>

      <h2 id="preferencias">Tus preferencias</h2>
      <p>Puedes aceptar o rechazar la analítica cuando quieras. Rechazarla no cambia nada en la tienda.</p>
      <BotonPreferencias />

      <h2 id="necesarias">1. Necesarias (siempre activas)</h2>
      <p>
        Son <strong>almacenamiento local</strong> propio de Ready (no cookies de terceros). Sin ellos no funcionarían el carrito, la sesión ni la demo, por
        eso no necesitan consentimiento. No se usan para medirte ni para publicidad.
      </p>
      <table>
        <thead><tr><th scope="col">Nombre</th><th scope="col">Para qué</th><th scope="col">Duración</th></tr></thead>
        <tbody>{NECESARIAS.map(([n, p, d]) => <tr key={n}><td><code>{n}</code></td><td>{p}</td><td>{d}</td></tr>)}</tbody>
      </table>

      <h2 id="analitica">2. Analítica (solo con tu permiso)</h2>
      <p>
        Si las aceptas, usamos <strong>Google Analytics 4</strong> (Google LLC) para saber, de forma agregada, cuántas personas visitan cada página y qué
        pasos del pedido se usan (ver un producto, agregar al carrito, pagar). Usamos el modo de consentimiento de Google con la publicidad siempre
        desactivada, sin señales de Google ni personalización de anuncios, y nunca enviamos tu nombre, correo, teléfono, dirección ni el nombre de tus hijos.
      </p>
      <table>
        <thead><tr><th scope="col">Cookie</th><th scope="col">Para qué</th><th scope="col">Duración</th></tr></thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Distinguir visitantes de forma anónima.</td><td>2 años</td></tr>
          <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Mantener el estado de la sesión de visita.</td><td>2 años</td></tr>
        </tbody>
      </table>
      <p>Si retiras el permiso, dejamos de medir y borramos estas cookies de tu navegador.</p>

      <h2 id="terceros">3. Servicios de terceros</h2>
      <p>
        El mapa para marcar tu dirección al pagar descarga imágenes de OpenStreetMap; los enlaces de WhatsApp te llevan a ese servicio. Ninguno instala
        cookies en Ready, pero al usarlos se aplican sus propias políticas.
      </p>

      <h2 id="navegador">4. Cómo borrarlas desde tu navegador</h2>
      <p>
        También puedes borrar las cookies y los datos del sitio desde la configuración de tu navegador. Si borras el almacenamiento local, se vaciarán tu
        carrito y tu sesión. Más información en la <Link href="/privacidad">Política de privacidad</Link>.
      </p>
    </Documento>
  );
}
