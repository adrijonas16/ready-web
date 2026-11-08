import AvisoDemo from '@/components/AvisoDemo';
import type { Metadata, Viewport } from "next";
import { clasesFuentes } from "./fuentes";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import { scriptTema } from "@/lib/tema-script";
import PieCuenta from "@/components/PieCuenta";
import WhatsappFlotante from "@/components/WhatsappFlotante";
import PieLegal from "@/components/PieLegal";
import ConsentimientoCookies from "@/components/ConsentimientoCookies";
import Analitica from "@/components/Analitica";
import { SITIO_DESCRIPCION, SITIO_LEMA, SITIO_NOMBRE, SITIO_URL } from "@/lib/sitio";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1424" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: { default: `${SITIO_NOMBRE}: útiles escolares en Arequipa`, template: `%s · ${SITIO_NOMBRE}` },
  description: SITIO_DESCRIPCION,
  applicationName: SITIO_NOMBRE,
  keywords: ["útiles escolares", "Arequipa", "lista de útiles", "lista escolar", "cuadernos", "colores", "mochila escolar", "compra online", "Perú", "colegio", "regreso a clases"],
  category: "shopping",
  creator: SITIO_NOMBRE,
  publisher: SITIO_NOMBRE,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: SITIO_NOMBRE,
    url: "/",
    title: `${SITIO_NOMBRE}: ${SITIO_LEMA}`,
    description: SITIO_DESCRIPCION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITIO_NOMBRE}: ${SITIO_LEMA}`,
    description: SITIO_DESCRIPCION,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: { canonical: "/" },
  appleWebApp: { title: SITIO_NOMBRE, statusBarStyle: "default" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PE" className={clasesFuentes} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-screen bg-fondo text-grafito flex flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            {/* min-h: el pie empieza fuera de la pantalla y no "salta" cuando la página termina de cargar */}
            <main className="flex-1 min-h-[100svh]">{children}</main>
            <WhatsappFlotante />
            <ConsentimientoCookies />
            <Analitica />
            <footer className="border-t border-linea bg-papel print:hidden">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                  <Logo />
                  <p className="mt-3 text-sm text-tenue max-w-xs">
                    Útiles escolares completos, a partir de la lista de tu colegio. Entregamos en Arequipa.
                  </p>
                </div>
                <nav aria-label="Comprar" className="flex flex-col gap-2 text-sm">
                  <p className="font-semibold text-grafito">Comprar</p>
                  <Link href="/upload" className="text-tenue hover:text-primario">Subir mi lista</Link>
                  <Link href="/lists" className="text-tenue hover:text-primario">Listas de colegios</Link>
                  <Link href="/catalog" className="text-tenue hover:text-primario">Arma tu pedido</Link>
                </nav>
                <PieCuenta />
                <PieLegal />
              </div>
              <AvisoDemo />
              <p className="border-t border-linea py-4 text-center text-xs text-tenue">© 2026 <span translate="no">Ready</span>, Arequipa (Perú)</p>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
