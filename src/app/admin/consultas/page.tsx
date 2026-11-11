'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { consultasApi } from '@/services/api';
import { ESTADO_CONSULTA, tiempoRestante } from '@/lib/consultas';
import { formatDate } from '@/lib/utils';
import type { Consulta } from '@/lib/types';
import { Cargando, tarjeta, useAvisos } from '../_ui';

type Filtro = 'PENDIENTE' | 'RESPONDIDAS' | 'TODAS';
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'PENDIENTE', label: 'Por responder' },
  { id: 'RESPONDIDAS', label: 'Respondidas' },
  { id: 'TODAS', label: 'Todas' },
];
const MAX_RESPUESTA = 1000;

export default function AdminConsultasPage() {
  const avisos = useAvisos();
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('PENDIENTE');
  const [ahora, setAhora] = useState(() => Date.now());

  const cargar = useCallback(() => consultasApi.getAll()
    .then(setConsultas)
    .catch(e => { avisos.error(e, 'No pudimos cargar las consultas'); setConsultas([]); }), [avisos]);
  useEffect(() => { cargar(); }, [cargar]);

  // El plazo de 24 h corre: se refresca el reloj y la lista cada minuto
  useEffect(() => {
    const t = setInterval(() => { setAhora(Date.now()); cargar(); }, 60_000);
    return () => clearInterval(t);
  }, [cargar]);

  const pendientes = consultas?.filter(c => c.estado === 'PENDIENTE').length ?? 0;
  const vencidas = consultas?.filter(c => c.estado === 'PENDIENTE' && tiempoRestante(c, ahora).vencida).length ?? 0;
  const visibles = useMemo(() => (consultas ?? []).filter(c =>
    filtro === 'TODAS' ? true : filtro === 'PENDIENTE' ? c.estado === 'PENDIENTE' : c.estado !== 'PENDIENTE'), [consultas, filtro]);

  const actualizar = (c: Consulta) => setConsultas(prev => prev?.map(x => (x.id === c.id ? c : x)) ?? prev);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Consultas de productos</h1>
          <p className="text-xs text-slate-500">Clientes que preguntan si conseguimos algo que no está en la tienda. Responde en menos de 24 horas.</p>
        </div>
        {vencidas > 0 && (
          <p role="status" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {vencidas} {vencidas === 1 ? 'consulta pasó' : 'consultas pasaron'} las 24 horas
          </p>
        )}
      </div>

      <div role="tablist" aria-label="Filtrar consultas" className="mb-4 flex flex-wrap gap-1.5">
        {FILTROS.map(f => (
          <button key={f.id} role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${filtro === f.id ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            {f.label}{f.id === 'PENDIENTE' && pendientes > 0 ? ` (${pendientes})` : ''}
          </button>
        ))}
      </div>

      {consultas === null ? <Cargando /> : visibles.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-400">
          {filtro === 'PENDIENTE' ? 'No hay consultas por responder.' : 'No hay consultas.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibles.map(c => <FilaConsulta key={c.id} c={c} ahora={ahora} onRespondida={actualizar} />)}
        </ul>
      )}
    </div>
  );
}

/** Enlace para escribirle al cliente por WhatsApp o correo, según el contacto que dejó. */
function Contacto({ c }: { c: Consulta }) {
  const celular = c.contacto && !c.contacto.includes('@') ? c.contacto : c.userPhone?.replace(/\D/g, '').slice(-9);
  const correo = c.contacto?.includes('@') ? c.contacto : c.userEmail;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {celular && (
        <>
          <a href={`https://wa.me/51${celular}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
            <MessageCircle className="h-3 w-3" aria-hidden="true" /> WhatsApp {celular}
          </a>
          <a href={`tel:+51${celular}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
            <Phone className="h-3 w-3" aria-hidden="true" /> Llamar
          </a>
        </>
      )}
      {correo && (
        <a href={`mailto:${correo}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
          <Mail className="h-3 w-3" aria-hidden="true" /> {correo}
        </a>
      )}
    </span>
  );
}

function FilaConsulta({ c, ahora, onRespondida }: { c: Consulta; ahora: number; onRespondida: (c: Consulta) => void }) {
  const avisos = useAvisos();
  const [editando, setEditando] = useState(c.estado === 'PENDIENTE');
  const [respuesta, setRespuesta] = useState(c.respuesta ?? '');
  const [enviando, setEnviando] = useState<boolean | null>(null);
  const estado = ESTADO_CONSULTA[c.estado];
  const plazo = tiempoRestante(c, ahora);
  const conCuenta = !!(c.userEmail || c.userPhone);

  const responder = async (disponible: boolean) => {
    if (enviando !== null) return;
    setEnviando(disponible);
    try {
      const r = await consultasApi.responder(c.id, { disponible, respuesta: respuesta.trim() || undefined });
      onRespondida(r);
      setEditando(false);
      avisos.exito(`Respondido: ${disponible ? 'sí' : 'no'} conseguimos «${c.producto}»`);
    } catch (e) {
      avisos.error(e, 'No pudimos guardar la respuesta');
    } finally {
      setEnviando(null);
    }
  };

  return (
    <li className={`${tarjeta} px-4 py-3 text-xs`} data-consulta={c.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{c.producto}</p>
          {c.detalle && <p className="mt-0.5 whitespace-pre-line text-slate-600">{c.detalle}</p>}
          <p className="mt-1 text-slate-700">{c.nombre || 'Cliente'}{conCuenta ? ' (con cuenta)' : ''}</p>
          <Contacto c={c} />
          <p className="mt-1 text-neutral-400">
            {formatDate(c.createdAt)}
            {c.supplyListId && <> · <Link href={`/lists/${c.supplyListId}`} className="text-blue-600 hover:underline">ver su lista</Link></>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${estado.clase}`}>{estado.texto}</span>
          {c.estado === 'PENDIENTE' && (
            <span className={`inline-flex items-center gap-1 font-bold ${plazo.vencida ? 'text-red-700' : 'text-slate-500'}`}>
              <Clock className="h-3 w-3" aria-hidden="true" /> {plazo.vencida ? `Plazo ${plazo.texto}` : `Vence ${plazo.texto}`}
            </span>
          )}
        </div>
      </div>

      {editando ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <label htmlFor={`resp-${c.id}`} className="mb-1 block text-[11px] font-bold text-slate-500">Mensaje para el cliente (opcional)</label>
          <textarea id={`resp-${c.id}`} value={respuesta} onChange={e => setRespuesta(e.target.value)} maxLength={MAX_RESPUESTA} rows={2}
            placeholder="Ej.: Sí, la marca Jovi a S/ 12.50. Llega en 2 días."
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <p className="mt-1 text-neutral-400">
            {conCuenta ? 'El cliente ve la respuesta en la tienda y recibe un aviso.' : 'El cliente la ve en «Mis consultas» de su navegador; avísale también por WhatsApp o correo.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => responder(true)} disabled={enviando !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> {enviando === true ? 'Guardando…' : 'Sí lo conseguimos'}
            </button>
            <button onClick={() => responder(false)} disabled={enviando !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50">
              <X className="h-3.5 w-3.5" aria-hidden="true" /> {enviando === false ? 'Guardando…' : 'No lo conseguimos'}
            </button>
            {c.estado !== 'PENDIENTE' && (
              <button onClick={() => { setEditando(false); setRespuesta(c.respuesta ?? ''); }} className="px-2 py-2 text-xs text-slate-500">Cancelar</button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-start justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="min-w-0 whitespace-pre-line text-slate-700">
            {c.respuesta || <span className="text-neutral-400">Sin mensaje.</span>}
            {c.respondidaAt && <span className="block text-neutral-400">Respondida el {formatDate(c.respondidaAt)}</span>}
          </p>
          <button onClick={() => setEditando(true)} className="text-xs font-bold text-blue-600 hover:underline">Cambiar respuesta</button>
        </div>
      )}
    </li>
  );
}
