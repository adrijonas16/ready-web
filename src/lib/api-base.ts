// Dirección de la API y modo demo.
// En modo demo (por defecto) toda la tienda funciona en el navegador, sin backend:
// las llamadas a DEMO_BASE las responde src/demo/servidor.ts. Para usar la API real,
// define NEXT_PUBLIC_MODO_DEMO=false y NEXT_PUBLIC_API_URL.

export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO !== 'false';
const DEMO_BASE = '/demo-api';
export const API = MODO_DEMO ? DEMO_BASE : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api');

const pausa = (ms: number) => new Promise(r => setTimeout(r, ms));

// En el navegador, el "servidor" de la demo se empieza a descargar junto con la página
// (y no recién cuando un componente pide datos): los productos aparecen antes.
let servidorDemo: Promise<typeof import('@/demo/servidor')> | null = null;
const cargarServidor = () => (servidorDemo ??= import('@/demo/servidor'));
if (typeof window !== 'undefined' && MODO_DEMO) cargarServidor();

/** Atiende una llamada en modo demo con una pequeña espera, como una red real. */
export async function llamarDemo(metodo: string, url: string, cuerpo: unknown, token?: string | null) {
  const { responder, ErrorDemo } = await cargarServidor();
  const u = new URL(url, 'http://demo.local');
  const ruta = u.pathname.replace(new RegExp(`^${DEMO_BASE}`), '');
  // Lecturas casi al instante; los envíos esperan un poco para que se vea el "Guardando…"
  await pausa(metodo.toUpperCase() === 'GET' ? 20 : 120 + Math.random() * 180);
  try {
    const data = await responder(metodo, ruta, u.searchParams, cuerpo, token);
    // Copia, como si viniera por la red: si no, React recibe el mismo objeto del "servidor" y no se entera de cambios
    return { status: 200, body: { success: true, data: data === undefined ? undefined : JSON.parse(JSON.stringify(data)) } };
  } catch (err) {
    const status = err instanceof ErrorDemo ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Error en la demo';
    const code = err instanceof ErrorDemo ? err.code : undefined;
    return { status, body: { success: false, error: { message, ...(code ? { code } : {}) } } };
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

// ── Llamadas con sesión ──

/** Token guardado al iniciar sesión (o null). */
export function tokenGuardado(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('token'); } catch { return null; }
}

/** Cabeceras comunes: sesión (Bearer) y JSON cuando el cuerpo no es un archivo. */
function cabeceras(init?: RequestInit): Headers {
  const h = new Headers(init?.headers);
  const token = tokenGuardado();
  if (token && !h.has('Authorization')) h.set('Authorization', `Bearer ${token}`);
  if (!(init?.body instanceof FormData)) {
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
    if (!h.has('Accept')) h.set('Accept', 'application/json');
  }
  return h;
}

/**
 * fetch() hacia la API con la sesión del usuario (Authorization: Bearer <token>) y cabeceras JSON.
 * Acepta rutas relativas a la API ('/products') o URLs completas. Devuelve la Response, como fetch.
 */
export function apiFetch(ruta: string, init?: RequestInit): Promise<Response> {
  const url = /^https?:\/\//.test(ruta) || ruta.startsWith(API) ? ruta : `${API}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  return fetch(url, { ...init, headers: cabeceras(init) });
}

/** Error de la API con el mensaje que devolvió el servidor y su código HTTP. */
export class ErrorApi extends Error { constructor(message: string, public status = 0) { super(message); } }

/** Llama a la API con apiFetch y devuelve `data`; lanza ErrorApi con el mensaje del servidor si falla. */
export async function apiJson<T = unknown>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> {
  const { method = 'GET', body } = opciones;
  const init: RequestInit = { method };
  if (body !== undefined) init.body = body instanceof FormData ? body : JSON.stringify(body);
  let r: Response;
  try { r = await apiFetch(ruta, init); }
  catch { throw new ErrorApi('No pudimos conectar con el servidor. Revisa tu conexión.'); }
  let d: { success?: boolean; data?: T; error?: { message?: string }; message?: string } | null = null;
  try { d = await r.json(); } catch { /* respuesta sin JSON */ }
  if (!r.ok || !d || d.success === false) {
    const msg = d?.error?.message || d?.message
      || (r.status === 401 ? 'Tu sesión venció. Vuelve a iniciar sesión.' : r.status === 403 ? 'No tienes permiso para hacer esto.' : `Error del servidor (${r.status})`);
    throw new ErrorApi(msg, r.status);
  }
  return d.data as T;
}

/** Texto legible de cualquier error (fetch, axios o propio). */
export function mensajeError(err: unknown, porDefecto = 'Algo salió mal. Inténtalo de nuevo.'): string {
  const e = err as { response?: { data?: { error?: { message?: string }; message?: string }; status?: number }; message?: string } | null;
  const delServidor = e?.response?.data?.error?.message || e?.response?.data?.message;
  if (delServidor) return delServidor;
  if (e?.response?.status === 403) return 'No tienes permiso para hacer esto.';
  if (e?.response?.status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
  return e?.message && !/^Request failed with status/.test(e.message) ? e.message : porDefecto;
}
