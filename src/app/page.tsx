import Link from 'next/link';
import { Upload, ShoppingBag, Package, CheckCircle, Search, Truck, ClipboardList, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sky-100">
      {/* Location Banner */}
      <div className="px-4 pt-4 max-w-7xl mx-auto">
        <div className="bg-blue-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
          <svg className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs text-blue-700"><span className="font-bold">Arequipa, Peru</span> — Proximamente en mas ciudades</p>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="px-4 pt-6 pb-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-stone-900 to-neutral-700 rounded-[20px] shadow-[0px_7px_15px_0px_rgba(0,0,0,0.14)] overflow-hidden relative p-6 md:p-10 min-h-[200px]">
          <div className="relative z-10 max-w-md">
            <p className="text-white text-xs font-bold tracking-wider uppercase mb-1">READY 2026</p>
            <h1 className="text-amber-300 text-3xl md:text-4xl font-bold leading-tight tracking-wide mb-2">
              Utiles Escolares
            </h1>
            <p className="text-white text-base font-semibold mb-1">Todo lo que necesitas</p>
            <p className="text-white/60 text-sm mb-6">para el ano escolar en un solo lugar</p>
            <div className="flex gap-3">
              <Link
                href="/lists"
                className="bg-amber-300 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-shadow duration-200 hover:shadow-lg"
              >
                Ver Listas
              </Link>
              <Link
                href="/send-list"
                className="bg-white/15 backdrop-blur-sm text-white px-5 py-2 rounded-lg font-semibold text-sm border border-white/20 transition-colors duration-150 hover:bg-white/25"
              >
                Enviar Lista
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending / How it works */}
      <section className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-slate-900 text-xl font-bold tracking-tight">Como funciona</h2>
          <Link href="/catalog" className="text-zinc-500 text-xs flex items-center gap-1 bg-white rounded-sm px-2 py-1 hover:text-blue-500 transition-colors duration-150">
            Ver catalogo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {[
            { icon: Upload, title: 'Sube tu lista', desc: 'Foto o texto de la lista', color: 'bg-blue-500' },
            { icon: Search, title: 'Procesamos', desc: 'Encontramos los productos', color: 'bg-blue-500' },
            { icon: ShoppingBag, title: 'Agrega al carrito', desc: 'Revisa y personaliza', color: 'bg-blue-500' },
            { icon: Truck, title: 'Recibe en casa', desc: 'Envio a domicilio', color: 'bg-blue-500' },
          ].map((step, i) => (
            <div key={i} className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.12)] p-5 text-center group transition-transform duration-200 hover:-translate-y-1">
              <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform duration-200 group-hover:scale-105`}>
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">{step.title}</h3>
              <p className="text-xs text-neutral-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-6 max-w-7xl mx-auto">
        <h2 className="text-slate-900 text-xl font-bold tracking-tight mb-5">Por que Ready</h2>
        <div className="grid md:grid-cols-3 gap-4 stagger-children">
          {[
            { icon: CheckCircle, title: 'Listas Oficiales', desc: 'Acceso directo a las listas de colegios asociados. Sin revision, compra inmediata.', bgColor: 'bg-green-100' },
            { icon: Package, title: 'Gran Catalogo', desc: 'Miles de productos de las mejores marcas en un solo lugar.', bgColor: 'bg-violet-100' },
            { icon: Truck, title: 'Envio a Domicilio', desc: 'Rastreo en tiempo real hasta que llega a tu puerta.', bgColor: 'bg-orange-100' },
          ].map((feat, i) => (
            <div key={i} className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.12)] p-6 group transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)]">
              <div className={`w-14 h-14 ${feat.bgColor} rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105`}>
                <feat.icon className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-6 pb-10 max-w-7xl mx-auto">
        <div className="bg-blue-500 rounded-[20px] p-8 text-white text-center shadow-lg shadow-blue-500/20">
          <h2 className="text-2xl font-bold mb-2">Listo para empezar?</h2>
          <p className="text-white/70 mb-6 text-sm">Envia tu lista de utiles o explora nuestro catalogo</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/send-list"
              className="bg-white text-blue-500 px-6 py-3 rounded-xl font-bold text-sm transition-shadow duration-200 hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Enviar mi Lista
            </Link>
            <Link
              href="/catalog"
              className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-xl font-bold text-sm border border-white/20 transition-colors duration-150 hover:bg-white/25 inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Ver Catalogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
