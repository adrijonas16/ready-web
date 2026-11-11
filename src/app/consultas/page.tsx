'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MessageCircleQuestionMark } from 'lucide-react';
import { consultasApi } from '@/services/api';
import { useAuth } from '@/lib/auth-context';
import { consultasGuardadas, ESTADO_CONSULTA, olvidarConsulta, tiempoRestante } from '@/lib/consultas';
import { formatDate } from '@/lib/utils';
import ConsultarProducto from '@/components/ConsultarProducto';
import type { Consulta } from '@/lib/types';
import Paginador, { usePaginacion } from '@/components/Paginador';

/** Las de la cuenta (con sesión) y las hechas en este navegador sin sesión. */
async function cargarConsultas(conSesion: boolean): Promise<Consulta[]> {
  const porId = new Map<string, Consulta>();
  if (conSesion) {
    try { (await consultasApi.mias()).forEach(c => porId.set(c.id, c)); } catch { /* sigue con las del navegador */ }
  }
  const locales = consultasGuardadas().filter(id => !porId.has(id));
  const r = await Promise.allSettled(locales.map(id => consultasApi.getById(id)));
  r.forEach((x, i) => {
    if (x.status === 'fulfilled') porId.set(x.value.id, x.value);
    else olvidarConsulta(locales[i]); // ya no existe o no es accesible: no se vuelve a pedir
  });
  return [...porId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function ConsultasPage() {
  const { user, isLoading } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const pag = usePaginacion(consultas ?? [], 10);

  const cargar = useCallback(() => cargarConsultas(!!user).then(setConsultas), [user]);
  useEffect(() => { if (!isLoading) cargar(); }, [isLoading, cargar]);

  // Mientras haya alguna sin responder, se revisa cada minuto
  const hayPendientes = !!consultas?.some(c => c.estado === 'PENDIENTE');
  useEffect(() => {
    if (!hayPendientes) return;
    const t = setInterval(cargar, 60_000);
    return () => clearInterval(t);
  }, [hayPendientes, cargar]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Mis consultas</h1>
      <p className="mt-1 text-tenue">Productos que nos preguntaste si podemos conseguir. Respondemos en menos de 24 horas.</p>

      {consultas === null ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" /></div>
      ) : consultas.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-linea-fuerte px-5 py-6 text-tenue">
          Aún no tienes consultas{!user && ' en este navegador'}. Si no encuentras un útil en el <Link href="/catalog" className="font-semibold text-primario underline underline-offset-2">catálogo</Link>, pregúntanos aquí abajo.
        </p>
      ) : (
        <>
        <ul id="lista-consultas" className="mt-6 scroll-mt-24 space-y-3">
          {pag.visibles.map(c => {
            const estado = ESTADO_CONSULTA[c.estado];
            const plazo = tiempoRestante(c);
            return (
              <li key={c.id} className="rounded-2xl border border-linea bg-papel px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.producto}</p>
                    {c.detalle && <p className="text-sm text-tenue whitespace-pre-line">{c.detalle}</p>}
                    <p className="mt-0.5 text-xs text-tenue">Preguntaste el {formatDate(c.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${estado.clase}`}>{estado.texto}</span>
                </div>
                {c.estado === 'PENDIENTE' ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-tenue">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {plazo.vencida ? 'Estamos por responderte, gracias por esperar.' : `Te respondemos ${plazo.texto} como máximo.`}
                  </p>
                ) : (
                  <div className="mt-3 rounded-xl bg-fondo px-4 py-3 text-sm">
                    <p className="font-semibold">{c.estado === 'DISPONIBLE' ? 'Sí lo podemos conseguir.' : 'Esta vez no lo pudimos conseguir.'}</p>
                    {c.respuesta && <p className="mt-1 whitespace-pre-line">{c.respuesta}</p>}
                    {c.estado === 'DISPONIBLE' && (
                      <p className="mt-2 text-tenue">Escríbenos por WhatsApp o agrégalo como útil en tu lista para incluirlo en tu pedido.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <Paginador {...pag} onCambiar={pag.setPagina} nombre="consultas" anclaId="lista-consultas" variante="tienda" />
        </>
      )}

      <section aria-labelledby="titulo-nueva" className="mt-10 rounded-2xl border border-linea bg-papel px-5 py-5">
        <h2 id="titulo-nueva" className="mb-3 flex items-center gap-2 text-lg font-bold">
          <MessageCircleQuestionMark className="h-5 w-5 text-primario" aria-hidden="true" /> Hacer otra consulta
        </h2>
        <ConsultarProducto compacto onEnviada={() => { cargar(); }} />
      </section>
    </div>
  );
}
