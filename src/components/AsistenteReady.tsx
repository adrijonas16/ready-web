'use client';

/**
 * "Pregúntale a Ready": el asistente de la web agéntica abierta.
 *
 * - Registra `globalThis.readyPage` (ReadyPage), que `public/site-actions.js` envuelve como
 *   herramientas website_*. El carrito se lee por una ref, siempre con su valor actual.
 * - Abre un panel con el chat del runtime oficial. El runtime busca su montaje con
 *   document.querySelector y cambia el DOM de los slots: React los deja vacíos y no los
 *   vuelve a dibujar.
 *
 * Ver docs/web-agentica.md.
 */
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { ReadyPage, type CarritoPort } from '@/agentic/ready-page';
import { arrancarAsistente } from '@/agentic/arranque';

declare global {
  var readyPage: ReadyPage | undefined;
}

export default function AsistenteReady() {
  const carrito = useCart();
  const carritoRef = useRef<CarritoPort>(carrito);
  // El carrito cambia en cada render del CartProvider: la ref guarda siempre el último.
  useEffect(() => {
    carritoRef.current = carrito;
  }, [carrito]);
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState('Cargando el asistente…');
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    globalThis.readyPage = new ReadyPage(() => carritoRef.current);
    return () => {
      globalThis.readyPage = undefined;
    };
  }, []);

  useEffect(() => {
    if (abierto) void arrancarAsistente(setEstado);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) setAbierto(false);
    };
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [abierto]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-controls="asistente-ready"
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-primario px-4 py-3 font-bold text-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:scale-105 motion-reduce:transition-none print:hidden sm:right-6 sm:bottom-24"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v11H9l-5 4z" />
          <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
        </svg>
        <span>{abierto ? 'Cerrar asistente' : 'Pregúntale a Ready'}</span>
      </button>

      {/* Siempre en el DOM (oculto) para que el runtime conserve el chat al cerrar y abrir. */}
      <aside
        id="asistente-ready"
        aria-labelledby="asistente-titulo"
        hidden={!abierto}
        className="asistente-ready fixed inset-x-0 bottom-0 z-[60] flex max-h-[85svh] flex-col border-t border-linea bg-papel shadow-[0_-18px_48px_-12px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:right-6 sm:bottom-40 sm:max-h-[calc(100svh-12rem)] sm:w-[440px] sm:rounded-2xl sm:border"
      >
        <div className="flex items-start gap-3 border-b border-linea px-4 py-3">
          <div>
            <h2 id="asistente-titulo" className="text-lg font-extrabold">Pregúntale a Ready</h2>
            <p className="text-sm text-tenue">Busca la lista de tu colegio, cotízala y arma tu carrito. El pedido lo confirmas tú.</p>
          </div>
          <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar el asistente" className="ml-auto rounded-lg px-2 py-1 text-xl text-tenue hover:bg-fondo">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          <p className="mb-2 text-xs text-tenue">
            Funciona en tu navegador con tu propia clave de IA. Tus mensajes van solo al proveedor que elijas abajo.
          </p>
          <p id="assistant-status" role="status" className="mb-2 rounded-lg bg-primario-claro px-3 py-2 text-sm">
            {estado}
          </p>
          <div id="agent-app" suppressHydrationWarning>
            <div data-ns-slot="header" />
            <div data-ns-slot="chat" />
            <div data-ns-slot="settings" />
            <div data-ns-slot="agents" />
          </div>
        </div>
      </aside>
    </>
  );
}
