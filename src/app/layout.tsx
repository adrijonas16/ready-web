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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1424" },
  ],
};

export const metadata: Metadata = {
  title: "Ready - Útiles escolares en Arequipa | Compra online",
  description: "Compra útiles escolares online en Arequipa. Sube la lista de tu colegio y elige entre productos económicos, normales o premium. Envío a domicilio.",
  keywords: ["útiles escolares", "arequipa", "lista de útiles", "cuadernos", "lápices", "colores", "mochila escolar", "compra online", "perú", "colegio"],
  openGraph: {
    title: "Ready - Útiles escolares en Arequipa",
    description: "Sube la lista de útiles de tu hijo y recibe todo en casa. Productos económicos, normales y premium.",
    url: "https://ready.pe",
    siteName: "Ready",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready - Útiles escolares en Arequipa",
    description: "Compra útiles escolares online. Envío a domicilio en Arequipa.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://ready.pe" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={clasesFuentes} suppressHydrationWarning>
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
            <footer className="border-t border-linea bg-papel print:hidden">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
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
