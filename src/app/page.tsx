import Link from 'next/link';
import { Upload, ShoppingBag, Package, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="flex justify-center gap-3 mb-6">
              <span className="text-6xl">🎒</span>
              <span className="text-6xl">✏️</span>
              <span className="text-6xl">📚</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                Ready
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              Tu lista de útiles escolares favorita. Compra todo lo que necesitas para el año escolar de forma inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/lists"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg shadow-purple-500/30"
              >
                <Package className="h-5 w-5" />
                Ver Listas
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                Ver Catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl hover:bg-blue-50 transition-colors">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <span className="text-4xl">📸</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Sube tu lista</h3>
              <p className="text-gray-600">Toma una foto de la lista de útiles de tu hijo</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-purple-50 transition-colors">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Procesamos</h3>
              <p className="text-gray-600">Encontramos los mejores productos para ti</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/30">
                <span className="text-4xl">🛒</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Agrega al carrito</h3>
              <p className="text-gray-600">Edita y personaliza tu pedido</p>
            </div>
            <div className="text-center p-6 rounded-2xl hover:bg-green-50 transition-colors">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                <span className="text-4xl">🚚</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Recibe en casa</h3>
              <p className="text-gray-600">Te enviamos todo listo para el año escolar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Listas Oficiales</h3>
              <p className="text-gray-600">
                Acceso directo a las listas oficiales de colegios asociados. Sin revisión, compra inmediata.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Gran Catálogo</h3>
              <p className="text-gray-600">
                Miles de productos de las mejores marcas. Encuentra todo lo que necesitas en un solo lugar.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Seguimiento</h3>
              <p className="text-gray-600">
                Rastreo en tiempo real de tu pedido desde que se prepara hasta que llega a tu puerta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-xl text-white/80 mb-8">Explora nuestro catálogo o busca tu lista de útiles escolares</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/lists"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Explorar Listas
            </Link>
            <Link
              href="/catalog"
              className="bg-white/20 backdrop-blur px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-colors"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}