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
  ["connect-src 'self'", ...GOOGLE, "https://unpkg.com", api, apiWs, esDesarrollo ? "ws: wss:" : null].filter(Boolean).join(" "),
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
      { source: "/:path*", headers: seguridad },
      ...RUTAS_NOINDEX.flatMap(r => [r, `${r}/:path*`]).map(source => ({
        source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
