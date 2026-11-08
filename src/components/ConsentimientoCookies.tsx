'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import {
  EVENTO_ABRIR_PREFERENCIAS, guardarConsentimiento, leerConsentimiento,
} from '@/lib/consentimiento';
import { activarAnalitica, desactivarAnalitica } from '@/lib/analytics';

/** Interruptor accesible (role="switch"). */
function Interruptor({ id, activo, onChange, deshabilitado = false, etiqueta }: {
  id: string; activo: boolean; onChange?: (v: boolean) => void; deshabilitado?: boolean; etiqueta: string;
}) {
  return (
    <button id={id} type="button" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={deshabilitado}
      onClick={() => onChange?.(!activo)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors motion-reduce:transition-none
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario
        ${activo ? 'border-primario bg-primario' : 'border-slate-300 bg-fondo'} ${deshabilitado ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
      <span aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full shadow transition-transform motion-reduce:transition-none ${activo ? 'translate-x-[22px] bg-white' : 'translate-x-0.5 bg-tenue'}`} />
    </button>
  );
}

/**
 * Aviso de cookies: barra inferior que no bloquea la página (sin fondo oscuro ni foco forzado)
 * y un panel de preferencias (diálogo nativo) que se puede volver a abrir desde el pie.
 */
export default function ConsentimientoCookies() {
  const [aviso, setAviso] = useState(false);
  const [analitica, setAnalitica] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const volverA = useRef<HTMLElement | null>(null);
  const idTitulo = useId();
  const caja = useRef<HTMLElement>(null);
  const [margenInferior, setMargenInferior] = useState(0);
  const idAnalitica = useId();

  // Al cargar: aplica la decisión guardada o muestra el aviso
  useEffect(() => {
    const c = leerConsentimiento();
    if (c) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar
      setAnalitica(c.analitica);
      if (c.analitica) activarAnalitica();
    } else {
      setAviso(true);
    }
  }, []);

  // Si la página tiene una barra fija abajo (pagar, agregar al carrito en celular), el aviso se pone encima y no la tapa
  useEffect(() => {
    if (!aviso) return;
    let cuadro = 0;
    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        let alto = 0;
        document.querySelectorAll<HTMLElement>('.fixed.bottom-0').forEach(el => {
          if (caja.current?.contains(el) || el.contains(caja.current)) return;
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.width >= innerWidth * 0.9 && r.bottom >= innerHeight - 1) alto = Math.max(alto, r.height);
        });
        setMargenInferior(alto);
      });
    };
    medir();
    const obs = new MutationObserver(medir);
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', medir);
    return () => { obs.disconnect(); window.removeEventListener('resize', medir); cancelAnimationFrame(cuadro); };
  }, [aviso]);

  const abrirPanel = useCallback(() => {
    volverA.current = document.activeElement as HTMLElement | null;
    setAnalitica(leerConsentimiento()?.analitica ?? false);
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  useEffect(() => {
    window.addEventListener(EVENTO_ABRIR_PREFERENCIAS, abrirPanel);
    return () => window.removeEventListener(EVENTO_ABRIR_PREFERENCIAS, abrirPanel);
  }, [abrirPanel]);

  const decidir = (conAnalitica: boolean) => {
    guardarConsentimiento(conAnalitica);
    setAnalitica(conAnalitica);
    if (conAnalitica) activarAnalitica(); else desactivarAnalitica();
    setAviso(false);
    if (dialogo.current?.open) dialogo.current.close();
  };

  // Al cerrar el panel, el foco vuelve a donde estaba (el botón del pie o el aviso)
  const alCerrar = () => {
    const destino = volverA.current;
    volverA.current = null;
    if (destino && document.contains(destino)) destino.focus();
  };

  const boton = 'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario';
  const principal = `${boton} bg-primario text-white hover:bg-primario-oscuro`;
  const secundario = `${boton} border-2 border-grafito text-grafito hover:bg-fondo`;
  const terciario = `${boton} text-primario underline underline-offset-4 hover:text-primario-oscuro`;

  return (
    <>
      {aviso && (
        <section ref={caja} aria-labelledby={`${idTitulo}-aviso`} style={margenInferior ? { bottom: margenInferior + 8 } : undefined}
          className="fixed inset-x-2 bottom-2 z-[45] mx-auto max-w-md rounded-2xl border border-linea bg-papel p-4 text-grafito shadow-[0_18px_50px_-12px_rgba(15,23,42,0.45)] animate-slide-up motion-reduce:animate-none print:hidden sm:inset-x-auto sm:bottom-4 sm:left-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-acento-oscuro" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id={`${idTitulo}-aviso`} className="font-display text-base font-bold">Usamos cookies</h2>
              <p className="mt-1 text-sm leading-relaxed text-tenue">
                Las necesarias guardan tu carrito, tu sesión y el tema. Con tu permiso, también medimos visitas de forma
                anónima para mejorar la tienda. <Link href="/cookies" className="font-semibold text-primario underline underline-offset-2">Más información</Link>
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={() => decidir(true)} className={`${principal} col-span-2 sm:col-span-1`}>Aceptar todas</button>
            <button type="button" onClick={() => decidir(false)} className={secundario}>Solo necesarias</button>
            <button type="button" onClick={abrirPanel} className={terciario}>Configurar</button>
          </div>
        </section>
      )}

      <dialog ref={dialogo} aria-labelledby={idTitulo} onClose={alCerrar}
        onClick={e => { if (e.target === dialogo.current) dialogo.current?.close(); }}
        className="m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-2xl border border-linea bg-papel p-0 text-grafito shadow-2xl backdrop:bg-black/50 print:hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={idTitulo} className="font-display text-xl font-bold">Preferencias de cookies</h2>
            <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar sin cambiar"
              className="-m-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-tenue hover:bg-fondo hover:text-grafito focus-visible:outline-2 focus-visible:outline-primario">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-sm text-tenue">
            Elige qué podemos guardar en tu navegador. Puedes cambiarlo cuando quieras desde «Preferencias de cookies», al pie de la página.
          </p>

          <ul className="mt-5 space-y-3">
            <li className="flex items-start justify-between gap-4 rounded-xl border border-linea p-4">
              <div>
                <p className="font-bold" id={`${idAnalitica}-nec`}>Necesarias</p>
                <p className="mt-1 text-sm text-tenue">Carrito, sesión, tema claro u oscuro, datos de la demo y esta misma elección. Sin ellas la tienda no funciona.</p>
                <p className="mt-1 text-xs font-semibold text-eco">Siempre activas</p>
              </div>
              <Interruptor id={`${idAnalitica}-n`} activo deshabilitado etiqueta="Cookies necesarias (siempre activas)" />
            </li>
            <li className="flex items-start justify-between gap-4 rounded-xl border border-linea p-4">
              <div>
                <label htmlFor={idAnalitica} className="font-bold">Analítica</label>
                <p className="mt-1 text-sm text-tenue">
                  Google Analytics 4: cuántas personas visitan cada página y qué pasos del pedido se usan. Sin publicidad ni datos personales.
                </p>
              </div>
              <Interruptor id={idAnalitica} activo={analitica} onChange={setAnalitica} etiqueta="Cookies de analítica" />
            </li>
          </ul>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => decidir(false)} className={secundario}>Solo necesarias</button>
            <button type="button" onClick={() => decidir(analitica)} className={secundario}>Guardar mi elección</button>
            <button type="button" onClick={() => decidir(true)} className={principal}>Aceptar todas</button>
          </div>
          <p className="mt-4 text-xs text-tenue">
            Detalle en la <Link href="/cookies" className="font-semibold text-primario underline underline-offset-2">Política de cookies</Link> y la{' '}
            <Link href="/privacidad" className="font-semibold text-primario underline underline-offset-2">Política de privacidad</Link>.
          </p>
        </div>
      </dialog>
    </>
  );
}
