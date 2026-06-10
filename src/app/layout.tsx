import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`} style={{ colorScheme: 'light' }}>
      <body className="min-h-screen bg-sky-100 flex flex-col antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="bg-white/60 backdrop-blur-sm py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="font-bold text-slate-900">Ready</span>
                  </div>
                  <p className="text-slate-400 text-sm">&copy; 2026 Ready. Todos los derechos reservados.</p>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
