import type { NextConfig } from "next";
import { RUTAS_NOINDEX } from "./src/lib/sitio";

const esDesarrollo = process.env.NODE_ENV === "development";

/** Origen (https://host) de una URL, o null si no es válida. */
const origen = (url?: string) => { try { return url ? new URL(url).origin : null; } catch { return null; } };

// API real (.NET) y su hub de SignalR (wss) cuando la tienda no está en modo demo
const api = process.env.NEXT_PUBLIC_MODO_DEMO !== "false" ? null : origen(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api");
const apiWs = api ? api.replace(/^http/, "ws") : null;

const GOOGLE = ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com"];

/**
 * Proveedores de IA del asistente (web agéntica, ver docs/web-agentica.md). El visitante usa
 * su propia clave y el navegador llama directo al proveedor: son los que el runtime ofrece en
 * "AI model settings" (public/runtime/ui.js). Un proveedor propio necesita agregarse aquí.
 */
const PROVEEDORES_IA = [
  "https://api.otari.ai",
  "https://generativelanguage.googleapis.com",
  "https://api.groq.com",
  "https://api.openai.com",
  "https://api.anthropic.com",
];

/** Archivos públicos de la web agéntica que otros sitios y herramientas leen (necesitan CORS). */
const PUBLICOS_AGENTICOS = [
  "/agent-manifest.json",
  "/ready_utiles.network.json",
  "/links.json",
  "/agent-mcp.json",
  "/.well-known/:archivo*",
];

/**
 * Content-Security-Policy.
 * - script-src usa 'unsafe-inline' porque Next inserta scripts en línea (datos de React Server Components y el
 *   script del tema) y las páginas son estáticas: un nonce obligaría a renderizar todo en cada petición
 *   (sin caché de CDN). El resto de directivas sigue siendo estricto (sin eval en producción, object-src 'none',
 *   base-uri y form-action 'self', frame-ancestors 'none').
 * - style-src 'unsafe-inline': estilos en línea de React/Leaflet y la hoja de Leaflet de unpkg.
 * - img-src https: las imágenes de campañas y noticias pueden venir de cualquier URL https que cargue el admin.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  ["connect-src 'self'", ...GOOGLE, ...PROVEEDORES_IA, "https://unpkg.com", api, apiWs, esDesarrollo ? "ws: wss:" : null].filter(Boolean).join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: data:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  ["form-action 'self'", api].filter(Boolean).join(" "),
  "frame-ancestors 'none'",
  ...(esDesarrollo ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const seguridad = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    // Cámara para fotografiar la lista y ubicación para el mapa del pago; lo demás, apagado
    value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
];

/** Páginas privadas: además del noindex en los metadatos, cabecera para buscadores (también cubre /admin, que es de cliente). */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      // Todo menos bridge/, que otros sitios cargan en un iframe oculto (sin X-Frame-Options).
      { source: "/((?!bridge/).*)", headers: seguridad },
      {
        source: "/bridge/:path*",
        headers: seguridad
          .filter(h => h.key !== "X-Frame-Options")
          .map(h => (h.key === "Content-Security-Policy" ? { ...h, value: h.value.replace("; frame-ancestors 'none'", "") } : h)),
      },
      ...PUBLICOS_AGENTICOS.map(source => ({ source, headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] })),
      {
        // El worker que aísla código del runtime: sin red ni otros workers (bundle_and_hosting.md)
        source: "/runtime/sandbox-worker.js",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'" }],
      },
      ...RUTAS_NOINDEX.flatMap(r => [r, `${r}/:path*`]).map(source => ({
        source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
