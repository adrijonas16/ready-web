/**
 * Arranca el runtime oficial de la web agéntica (public/runtime, copiado sin cambios de la
 * skill agentify-website) dentro de #agent-app. Adaptado de la plantilla
 * `.claude/skills/agentify-website/templates/site.js` (Apache-2.0).
 *
 * El runtime pesa ~2 MB: se carga la primera vez que el visitante abre el asistente.
 * Ready no tiene acciones irreversibles (nada crea pedidos ni cobra), así que no hace falta
 * un diálogo de confirmación propio; el consentimiento de sitios asociados usa la tarjeta
 * del runtime.
 */

interface Motor {
  mockLLM?: boolean;
  byokKey?: string;
  onConsent: (info: unknown) => Promise<unknown>;
}

export const SALUDO =
  'Hola, soy el asistente de Ready. Puedo buscar la lista oficial de tu colegio, cotizarla en tres paquetes, encontrar útiles y armar tu carrito. ¿De qué colegio y grado es tu lista?';

let arrancando: Promise<Motor | null> | null = null;

/** Arranca una sola vez; las llamadas siguientes devuelven la misma promesa. */
export function arrancarAsistente(alEstado: (texto: string) => void): Promise<Motor | null> {
  arrancando ??= arrancar(alEstado);
  return arrancando;
}

async function arrancar(alEstado: (texto: string) => void): Promise<Motor | null> {
  const base = new URL('/', window.location.href).href;
  try {
    const url = new URL('runtime/index.js', base).href;
    // El runtime es un módulo ES estático en public/: el empaquetador no debe tocarlo.
    const { boot } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)) as {
      boot: (selector: string, opciones: object) => Promise<{ engine: Motor }>;
    };
    const { engine } = await boot('#agent-app', {
      originUrl: base,
      sandboxWorkerUrl: new URL('runtime/sandbox-worker.js', base).href,
    });
    const consentir = engine.onConsent.bind(engine);
    engine.onConsent = async (info: unknown) => {
      const respuesta = consentir(info);
      enfocarTarjeta();
      const decision = await respuesta;
      if (document.activeElement === document.body) document.querySelector<HTMLElement>('#ns-input')?.focus();
      return decision;
    };
    // Mismo criterio que la insignia "API key required" del runtime (runtime/ui.js).
    const faltaClave = !engine.mockLLM && (!engine.byokKey || engine.byokKey === 'demo');
    alEstado(
      faltaClave
        ? 'Para conversar, agrega tu clave de IA en "AI model settings", abajo.'
        : 'Conectado. Pregunta por la lista de tu colegio.',
    );
    if (!faltaClave) saludar();
    return engine;
  } catch (error) {
    alEstado('El asistente no pudo cargar. La tienda sigue funcionando sin él.');
    console.error('Error al arrancar el asistente', error);
    arrancando = null;
    return null;
  }
}

/** Reemplaza el primer mensaje genérico del runtime por el saludo de Ready. */
function saludar(): void {
  const primero = document.querySelector('#ns-msgs .ns-msg.bot');
  if (primero) primero.textContent = SALUDO;
}

/** Nombra la tarjeta de consentimiento más reciente para lectores de pantalla y la enfoca. */
function enfocarTarjeta(): void {
  const tarjetas = document.querySelectorAll('#ns-msgs .ns-consent');
  const tarjeta = tarjetas[tarjetas.length - 1];
  const titulo = tarjeta?.querySelector<HTMLElement>('.ns-consent-title');
  if (!tarjeta || !titulo) return;
  tarjeta.setAttribute('role', 'group');
  tarjeta.setAttribute('aria-label', titulo.textContent ?? '');
  titulo.tabIndex = -1;
  titulo.focus();
}
