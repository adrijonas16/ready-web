import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/700.css";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Ready - Utiles Escolares en Arequipa | Compra Online",
  description: "Compra utiles escolares online en Arequipa. Sube la lista de tu colegio, elige entre productos economicos, estandar o premium. Envio a domicilio en 24-48 horas.",
  keywords: ["utiles escolares", "arequipa", "lista de utiles", "cuadernos", "lapices", "colores", "mochila escolar", "compra online", "peru", "colegio"],
  openGraph: {
    title: "Ready - Utiles Escolares en Arequipa",
    description: "Sube la lista de utiles de tu hijo y recibe todo en casa. Productos economicos, estandar y premium.",
    url: "https://ready.pe",
    siteName: "Ready",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready - Utiles Escolares en Arequipa",
    description: "Compra utiles escolares online. Envio a domicilio en Arequipa.",
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
    <html lang="es" style={{ colorScheme: 'light' }}>
      <body className="min-h-screen bg-fondo text-grafito flex flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-linea bg-papel">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
                <div>
                  <Logo />
                  <p className="mt-3 text-sm text-tenue max-w-xs">
                    Útiles escolares completos, a partir de la lista de tu colegio. Entregamos en Arequipa.
                  </p>
                </div>
                <nav aria-label="Comprar" className="flex flex-col gap-2 text-sm">
                  <p className="font-semibold text-grafito">Comprar</p>
                  <Link href="/upload" className="text-tenue hover:text-pizarra">Subir mi lista</Link>
                  <Link href="/lists" className="text-tenue hover:text-pizarra">Listas de colegios</Link>
                  <Link href="/catalog" className="text-tenue hover:text-pizarra">Catálogo</Link>
                </nav>
                <nav aria-label="Mi cuenta" className="flex flex-col gap-2 text-sm">
                  <p className="font-semibold text-grafito">Mi cuenta</p>
                  <Link href="/my-lists" className="text-tenue hover:text-pizarra">Mis listas</Link>
                  <Link href="/cart" className="text-tenue hover:text-pizarra">Carrito</Link>
                  <Link href="/login" className="text-tenue hover:text-pizarra">Iniciar sesión</Link>
                </nav>
              </div>
              <p className="border-t border-linea py-4 text-center text-xs text-tenue">© 2026 Ready, Arequipa (Perú)</p>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
