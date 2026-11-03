// Dirección de la API y modo demo.
// En modo demo (por defecto) toda la tienda funciona en el navegador, sin backend:
// las llamadas a DEMO_BASE las responde src/demo/servidor.ts. Para usar la API real,
// define NEXT_PUBLIC_MODO_DEMO=false y NEXT_PUBLIC_API_URL.

export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO !== 'false';
const DEMO_BASE = '/demo-api';
export const API = MODO_DEMO ? DEMO_BASE : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api');

const pausa = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Atiende una llamada en modo demo con una pequeña espera, como una red real. */
export async function llamarDemo(metodo: string, url: string, cuerpo: unknown, token?: string | null) {
  const { responder, ErrorDemo } = await import('@/demo/servidor');
  const u = new URL(url, 'http://demo.local');
  const ruta = u.pathname.replace(new RegExp(`^${DEMO_BASE}`), '');
  await pausa(120 + Math.random() * 180);
  try {
    const data = await responder(metodo, ruta, u.searchParams, cuerpo, token);
    return { status: 200, body: { success: true, data } };
  } catch (err) {
    const status = err instanceof ErrorDemo ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Error en la demo';
    return { status, body: { success: false, error: { message } } };
  }
}

const esDemo = (url: string) => url.startsWith(DEMO_BASE) || url.startsWith(`${typeof location !== 'undefined' ? location.origin : ''}${DEMO_BASE}`);

/** Desvía fetch() de las páginas que llaman a la API directamente. */
function instalarFetchDemo() {
  if (typeof window === 'undefined' || !MODO_DEMO) return;
  const w = window as Window & { __fetchDemo?: boolean };
  if (w.__fetchDemo) return;
  w.__fetchDemo = true;
  const original = window.fetch.bind(window);
  window.fetch = async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    if (!esDemo(url)) return original(entrada, init);
    let cuerpo: unknown = init?.body;
    if (typeof cuerpo === 'string') { try { cuerpo = JSON.parse(cuerpo); } catch { /* texto */ } }
    const cab = new Headers(init?.headers);
    const token = cab.get('Authorization') ?? localStorage.getItem('token');
    const r = await llamarDemo(init?.method ?? 'GET', url, cuerpo, token);
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };
}

instalarFetchDemo();
