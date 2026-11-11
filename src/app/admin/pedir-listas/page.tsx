'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Clock, Copy, History, Mail, MessageCircle, Pencil, Phone, Search, Send, Settings2, Square } from 'lucide-react';
import { contactoColegiosApi } from '@/services/api';
import { buscarOpciones } from '@/lib/buscar';
import type { ColegioContacto, ConfigContactoColegios, EstadoContactoColegio, RegistroContacto } from '@/lib/types';
import { Cargando, Interruptor, Modal, botonPrimario, campo, fechaCorta, tarjeta, useAvisos } from '../_ui';
import Paginador, { usePaginacion } from '@/components/Paginador';

// ── Estados y textos ──
const ESTADOS: { id: EstadoContactoColegio; label: string; clase: string }[] = [
  { id: 'SIN_CONTACTAR', label: 'Sin contactar', clase: 'bg-slate-100 text-slate-700' },
  { id: 'CONTACTADO', label: 'Contactado', clase: 'bg-blue-100 text-blue-800' },
  { id: 'RESPONDIO', label: 'Respondió', clase: 'bg-amber-100 text-amber-800' },
  { id: 'LISTA_RECIBIDA', label: 'Lista recibida', clase: 'bg-green-100 text-green-800' },
  { id: 'NO_INTERESADO', label: 'No interesado', clase: 'bg-red-100 text-red-800' },
];
const estadoDe = (id: EstadoContactoColegio) => ESTADOS.find(e => e.id === id) ?? ESTADOS[0];
const CANAL: Record<string, string> = { WHATSAPP: 'WhatsApp', CORREO: 'Correo', LLAMADA: 'Llamada', NOTA: 'Nota', ENLACE: 'Enlace del colegio' };
const RESULTADO: Record<string, string> = {
  ENVIADO: 'Mensaje enviado', RECORDATORIO: 'Recordatorio', LISTA_SUBIDA: 'Subió una lista', ERROR_CORREO: 'Error al enviar el correo',
  CONTESTARON: 'Contestaron', NO_CONTESTAN: 'No contestan', PIDIERON_CORREO: 'Pidieron correo', NO_INTERESADO: 'No le interesa',
};
const POR_PAGINA = 25;
const vencido = (c: ColegioContacto, ahora: number) =>
  !!c.proximoContactoAt && new Date(c.proximoContactoAt).getTime() <= ahora && (c.estado === 'CONTACTADO' || c.estado === 'RESPONDIO');

type Filtro = 'TODOS' | 'HOY' | 'SIN_DATOS' | EstadoContactoColegio;

export default function PedirListasPage() {
  const avisos = useAvisos();
  const [colegios, setColegios] = useState<ColegioContacto[] | null>(null);
  const [correo, setCorreo] = useState<{ configurado: boolean; remitente?: string | null }>({ configurado: false });
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [soloSinLista, setSoloSinLista] = useState(true);
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<ColegioContacto | null>(null);
  const [llamando, setLlamando] = useState<ColegioContacto | null>(null);
  const [historial, setHistorial] = useState<ColegioContacto | null>(null);
  const [verConfig, setVerConfig] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ahora] = useState(() => Date.now());

  const cargar = useCallback(() => Promise.all([contactoColegiosApi.listar(), contactoColegiosApi.config()])
    .then(([l, c]) => { setColegios(l); setCorreo({ configurado: c.correoConfigurado, remitente: c.remitente }); })
    .catch(e => { avisos.error(e, 'No pudimos cargar los colegios'); setColegios([]); }), [avisos]);
  useEffect(() => { cargar(); }, [cargar]);

  const actualizar = (c: ColegioContacto) => setColegios(prev => prev?.map(x => (x.id === c.id ? c : x)) ?? prev);

  const conteo = useMemo(() => {
    const r: Record<string, number> = { HOY: 0, SIN_DATOS: 0 };
    (colegios ?? []).forEach(c => {
      r[c.estado] = (r[c.estado] ?? 0) + 1;
      if (vencido(c, ahora)) r.HOY++;
      if (!c.whatsapp && !c.correo && !c.telefono) r.SIN_DATOS++;
    });
    return r;
  }, [colegios, ahora]);

  const visibles = useMemo(() => {
    const q = busqueda.trim();
    // Con búsqueda: misma búsqueda amigable que en la tienda (cualquier palabra, sin tildes, con errores de tipeo)
    const base = q ? buscarOpciones((colegios ?? []).map(c => ({ ...c, label: c.nombre })), q,
      c => `${c.nombre} ${c.contactoNombre ?? ''} ${c.correo ?? ''} ${c.whatsapp ?? ''}`) : (colegios ?? []);
    const filtrados = base.filter(c => {
      if (soloSinLista && c.listasAprobadas > 0 && filtro !== 'LISTA_RECIBIDA') return false;
      if (filtro === 'HOY' && !vencido(c, ahora)) return false;
      if (filtro === 'SIN_DATOS' && (c.whatsapp || c.correo || c.telefono)) return false;
      if (filtro !== 'TODOS' && filtro !== 'HOY' && filtro !== 'SIN_DATOS' && c.estado !== filtro) return false;
      return true;
    });
    // Sin búsqueda: primero a quienes toca recordar; con búsqueda se respeta el orden por parecido
    return q ? filtrados : filtrados.sort((a, b) => Number(vencido(b, ahora)) - Number(vencido(a, ahora)) || a.nombre.localeCompare(b.nombre, 'es'));
  }, [colegios, filtro, busqueda, soloSinLista, ahora]);

  const pag = usePaginacion(visibles, POR_PAGINA, `${filtro}|${busqueda}|${soloSinLista}`);

  const alternar = (id: string) => setElegidos(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const conCorreoElegidos = (colegios ?? []).filter(c => elegidos.has(c.id) && c.correo).length;

  const enviarCorreos = async () => {
    if (!correo.configurado || enviando || elegidos.size === 0) return;
    if (!confirm(`¿Enviar el pedido de lista por correo a ${conCorreoElegidos} colegio(s)?`)) return;
    setEnviando(true);
    try {
      const r = await contactoColegiosApi.enviarCorreos([...elegidos]);
      const partes = [`${r.enviados} correo(s) enviado(s)`];
      if (r.sinCorreo.length) partes.push(`${r.sinCorreo.length} sin correo`);
      if (r.omitidos.length) partes.push(`${r.omitidos.length} omitido(s) por no estar interesados`);
      if (r.fallidos.length) avisos.error(null, `No se enviaron: ${r.fallidos.slice(0, 3).join('; ')}${r.fallidos.length > 3 ? '…' : ''}`);
      avisos.exito(partes.join(', '));
      setElegidos(new Set());
      await cargar();
    } catch (e) { avisos.error(e, 'No pudimos enviar los correos'); }
    finally { setEnviando(false); }
  };

  /** Abre WhatsApp con el mensaje armado y anota el contacto. */
  const whatsapp = async (c: ColegioContacto) => {
    if (!c.whatsapp) return;
    // La ventana se abre en el clic (si se abre después de esperar, el navegador la bloquea)
    const ventana = window.open('', '_blank');
    try {
      const recordatorio = c.estado !== 'SIN_CONTACTAR';
      const m = await contactoColegiosApi.mensaje(c.id);
      const texto = recordatorio ? m.recordatorio : m.mensaje;
      const url = `https://wa.me/51${c.whatsapp}?text=${encodeURIComponent(texto)}`;
      if (ventana) ventana.location.replace(url); else window.location.assign(url);
      actualizar(await contactoColegiosApi.registrar(c.id, { canal: 'WHATSAPP', resultado: recordatorio ? 'RECORDATORIO' : 'ENVIADO', esRecordatorio: recordatorio }));
    } catch (e) {
      ventana?.close();
      avisos.error(e, 'No pudimos preparar el mensaje');
    }
  };

  const correoUno = async (c: ColegioContacto) => {
    if (!c.correo || !correo.configurado) return;
    try {
      const r = await contactoColegiosApi.enviarCorreos([c.id], c.estado !== 'SIN_CONTACTAR');
      if (r.enviados) { avisos.exito(`Correo enviado a ${c.nombre}`); await cargar(); }
      else avisos.error(null, r.fallidos[0] ?? r.omitidos[0] ?? 'No se envió el correo');
    } catch (e) { avisos.error(e, 'No pudimos enviar el correo'); }
  };

  const copiarEnlace = async (c: ColegioContacto) => {
    try {
      const m = await contactoColegiosApi.mensaje(c.id);
      await navigator.clipboard.writeText(m.enlace);
      if (!c.enlace) actualizar({ ...c, enlace: m.enlace });
      avisos.exito('Enlace copiado: el colegio puede subir sus listas ahí sin crear cuenta');
    } catch (e) { avisos.error(e, 'No pudimos copiar el enlace'); }
  };

  const cambiarEstado = async (c: ColegioContacto, estado: EstadoContactoColegio) => {
    try { actualizar(await contactoColegiosApi.registrar(c.id, { canal: 'NOTA', resultado: 'CAMBIO_ESTADO', nota: `Estado: ${estadoDe(estado).label}`, estado })); }
    catch (e) { avisos.error(e, 'No pudimos cambiar el estado'); }
  };

  const FILTROS: { id: Filtro; label: string; n?: number }[] = [
    { id: 'TODOS', label: 'Todos', n: colegios?.length },
    { id: 'HOY', label: 'Para recordar hoy', n: conteo.HOY },
    ...ESTADOS.map(e => ({ id: e.id as Filtro, label: e.label, n: conteo[e.id] ?? 0 })),
    { id: 'SIN_DATOS', label: 'Sin datos de contacto', n: conteo.SIN_DATOS },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pedir listas a colegios</h1>
          <p className="text-xs text-slate-500">Escríbeles por WhatsApp con un clic o por correo. Cada mensaje lleva un enlace para que el colegio suba sus listas sin crear cuenta.</p>
        </div>
        <button onClick={() => setVerConfig(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" /> Mensaje y recordatorios
        </button>
      </div>

      <p role="status" className={`mb-4 rounded-xl px-4 py-2.5 text-xs ${correo.configurado ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
        {correo.configurado
          ? <>Correo activo{correo.remitente ? <> desde <b>{correo.remitente}</b></> : null}. Los recordatorios por correo salen solos según la configuración.</>
          : <>El correo aún no está activo: falta la clave del servicio de correo. Mientras tanto, WhatsApp y llamadas funcionan.</>}
      </p>

      <div role="tablist" aria-label="Filtrar colegios" className="mb-3 flex flex-wrap gap-1.5">
        {FILTROS.map(f => (
          <button key={f.id} role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${filtro === f.id ? 'bg-blue-500 text-white' : f.id === 'HOY' && (f.n ?? 0) > 0 ? 'bg-amber-100 text-amber-900' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            {f.label}{f.n !== undefined ? ` (${f.n})` : ''}
          </button>
        ))}
      </div>

      <div className={`${tarjeta} mb-3 flex flex-wrap items-center gap-3 p-3`}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar colegio, contacto, correo…"
            aria-label="Buscar colegio" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs" />
        </div>
        <Interruptor activo={soloSinLista} onChange={setSoloSinLista} etiqueta="Ocultar los que ya tienen lista" />
        <button onClick={enviarCorreos} disabled={!correo.configurado || conCorreoElegidos === 0 || enviando}
          title={!correo.configurado ? 'Activa el correo para enviar por lotes' : undefined}
          className={`${botonPrimario} !py-1.5 text-xs`}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" /> {enviando ? 'Enviando…' : `Enviar correo (${conCorreoElegidos})`}
        </button>
      </div>

      {colegios === null ? <Cargando /> : visibles.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-400">No hay colegios con este filtro.</p>
      ) : (
        <>
          <ul id="lista-colegios" className="space-y-2 scroll-mt-20">
            {pag.visibles.map(c => (
              <FilaColegio key={c.id} c={c} ahora={ahora} elegido={elegidos.has(c.id)} onElegir={() => alternar(c.id)}
                correoActivo={correo.configurado}
                onWhatsapp={() => whatsapp(c)} onCorreo={() => correoUno(c)} onLlamar={() => setLlamando(c)}
                onEnlace={() => copiarEnlace(c)} onEditar={() => setEditando(c)} onHistorial={() => setHistorial(c)}
                onEstado={e => cambiarEstado(c, e)} />
            ))}
          </ul>
          <Paginador {...pag} onCambiar={pag.setPagina} nombre="colegios" anclaId="lista-colegios" />
        </>
      )}

      {editando && <EditarContacto c={editando} onClose={() => setEditando(null)} onGuardado={c => { actualizar(c); setEditando(null); }} />}
      {llamando && <RegistrarLlamada c={llamando} onClose={() => setLlamando(null)} onGuardado={c => { actualizar(c); setLlamando(null); }} />}
      {historial && <Historial c={historial} onClose={() => setHistorial(null)} />}
      {verConfig && <ConfigMensaje onClose={() => setVerConfig(false)} />}
    </div>
  );
}

function FilaColegio({ c, ahora, elegido, onElegir, correoActivo, onWhatsapp, onCorreo, onLlamar, onEnlace, onEditar, onHistorial, onEstado }: {
  c: ColegioContacto; ahora: number; elegido: boolean; onElegir: () => void; correoActivo: boolean;
  onWhatsapp: () => void; onCorreo: () => void; onLlamar: () => void; onEnlace: () => void; onEditar: () => void; onHistorial: () => void;
  onEstado: (e: EstadoContactoColegio) => void;
}) {
  const toca = vencido(c, ahora);
  const boton = 'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <li className={`${tarjeta} px-4 py-3 text-xs ${toca ? 'ring-2 ring-amber-300' : ''}`} data-colegio={c.id}>
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={onElegir} role="checkbox" aria-checked={elegido} aria-label={`Elegir ${c.nombre}`} className="mt-0.5 text-slate-500 hover:text-blue-600">
          {elegido ? <CheckSquare className="h-4 w-4 text-blue-600" aria-hidden="true" /> : <Square className="h-4 w-4" aria-hidden="true" />}
        </button>
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-bold text-slate-900">{c.nombre}</p>
          <p className="text-neutral-500">{[c.niveles, c.gestion].filter(Boolean).join(' · ')}</p>
          <p className="mt-1 text-slate-700">
            {c.contactoNombre && <span className="mr-2 font-semibold">{c.contactoNombre}</span>}
            {c.whatsapp && <span className="mr-2">WhatsApp {c.whatsapp}</span>}
            {c.telefono && <span className="mr-2">Tel. {c.telefono}</span>}
            {c.correo && <span className="mr-2">{c.correo}</span>}
            {!c.whatsapp && !c.telefono && !c.correo && <button onClick={onEditar} className="font-bold text-blue-600 hover:underline">Agregar contacto</button>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <select value={c.estado} onChange={e => onEstado(e.target.value as EstadoContactoColegio)} aria-label={`Estado de ${c.nombre}`}
            className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold ${estadoDe(c.estado).clase}`}>
            {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <span className="text-neutral-500">
            {c.listasAprobadas > 0 ? `${c.listasAprobadas} lista(s) aprobada(s)` : c.listasPorRevisar > 0 ? `${c.listasPorRevisar} por revisar` : 'Sin lista'}
          </span>
          {c.ultimoContactoAt && <span className="text-neutral-400">Último: {fechaCorta(c.ultimoContactoAt)}</span>}
          {c.proximoContactoAt && (
            <span className={`inline-flex items-center gap-1 ${toca ? 'font-bold text-amber-800' : 'text-neutral-400'}`}>
              <Clock className="h-3 w-3" aria-hidden="true" /> {toca ? 'Toca recordar' : `Recordar: ${fechaCorta(c.proximoContactoAt)}`}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
        <button onClick={onWhatsapp} disabled={!c.whatsapp} title={c.whatsapp ? undefined : 'Agrega el WhatsApp del colegio'}
          className={`${boton} bg-emerald-600 text-white hover:bg-emerald-700`}>
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> {c.estado === 'SIN_CONTACTAR' ? 'WhatsApp' : 'Recordar por WhatsApp'}
        </button>
        <button onClick={onCorreo} disabled={!c.correo || !correoActivo}
          title={!c.correo ? 'Agrega el correo del colegio' : !correoActivo ? 'El correo aún no está activo' : undefined}
          className={`${boton} bg-blue-500 text-white hover:bg-blue-600`}>
          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Correo
        </button>
        <button onClick={onLlamar} disabled={!c.telefono && !c.whatsapp} className={`${boton} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
          <Phone className="h-3.5 w-3.5" aria-hidden="true" /> Llamada
        </button>
        <button onClick={onEnlace} className={`${boton} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar enlace
        </button>
        <button onClick={onEditar} className={`${boton} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Contacto
        </button>
        <button onClick={onHistorial} className={`${boton} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
          <History className="h-3.5 w-3.5" aria-hidden="true" /> Historial
        </button>
      </div>
    </li>
  );
}

function EditarContacto({ c, onClose, onGuardado }: { c: ColegioContacto; onClose: () => void; onGuardado: (c: ColegioContacto) => void }) {
  const avisos = useAvisos();
  const [d, setD] = useState({ contactoNombre: c.contactoNombre ?? '', whatsapp: c.whatsapp ?? '', telefono: c.telefono ?? '', correo: c.correo ?? '', notas: c.notas ?? '' });
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD(x => ({ ...x, [k]: e.target.value }));
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try { onGuardado(await contactoColegiosApi.actualizar(c.id, d)); avisos.exito('Contacto guardado'); }
    catch (err) { avisos.error(err, 'No pudimos guardar el contacto'); }
    finally { setGuardando(false); }
  };
  return (
    <Modal titulo={`Contacto de ${c.nombre}`} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3 p-4 text-sm">
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Nombre del contacto (director, secretaría…)</span>
          <input value={d.contactoNombre} onChange={set('contactoNombre')} maxLength={120} className={campo} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">WhatsApp (celular de 9 dígitos)</span>
            <input value={d.whatsapp} onChange={set('whatsapp')} inputMode="tel" maxLength={16} placeholder="987 654 321" className={campo} /></label>
          <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Teléfono</span>
            <input value={d.telefono} onChange={set('telefono')} inputMode="tel" maxLength={30} placeholder="054 123456" className={campo} /></label>
        </div>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Correo</span>
          <input value={d.correo} onChange={set('correo')} type="email" maxLength={150} className={campo} /></label>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Notas</span>
          <textarea value={d.notas} onChange={set('notas')} maxLength={2000} rows={3} className={campo} /></label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-slate-600">Cancelar</button>
          <button type="submit" disabled={guardando} className={botonPrimario}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}

const RESULTADOS_LLAMADA: { id: string; label: string; estado?: EstadoContactoColegio }[] = [
  { id: 'CONTESTARON', label: 'Contestaron: enviarán la lista', estado: 'RESPONDIO' },
  { id: 'PIDIERON_CORREO', label: 'Pidieron que les escribamos', estado: 'RESPONDIO' },
  { id: 'NO_CONTESTAN', label: 'No contestan' },
  { id: 'NO_INTERESADO', label: 'No les interesa', estado: 'NO_INTERESADO' },
];

function RegistrarLlamada({ c, onClose, onGuardado }: { c: ColegioContacto; onClose: () => void; onGuardado: (c: ColegioContacto) => void }) {
  const avisos = useAvisos();
  const [guion, setGuion] = useState('');
  const [resultado, setResultado] = useState(RESULTADOS_LLAMADA[0].id);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { contactoColegiosApi.mensaje(c.id).then(m => setGuion(m.mensaje)).catch(() => {}); }, [c.id]);
  const numero = c.telefono || c.whatsapp || '';
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const r = RESULTADOS_LLAMADA.find(x => x.id === resultado)!;
    try { onGuardado(await contactoColegiosApi.registrar(c.id, { canal: 'LLAMADA', resultado: r.id, nota: nota.trim() || undefined, estado: r.estado })); avisos.exito('Llamada anotada'); }
    catch (err) { avisos.error(err, 'No pudimos anotar la llamada'); }
    finally { setGuardando(false); }
  };
  return (
    <Modal titulo={`Llamar a ${c.nombre}`} onClose={onClose} ancho="max-w-xl">
      <form onSubmit={guardar} className="space-y-3 p-4 text-sm">
        <a href={`tel:${numero.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          <Phone className="h-4 w-4" aria-hidden="true" /> Llamar al {numero}
        </a>
        {guion && (
          <div>
            <p className="mb-1 text-xs font-bold text-slate-600">Guion (el mismo mensaje)</p>
            <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{guion}</p>
          </div>
        )}
        <fieldset>
          <legend className="mb-1 text-xs font-bold text-slate-600">¿Cómo fue?</legend>
          <div className="space-y-1">
            {RESULTADOS_LLAMADA.map(r => (
              <label key={r.id} className="flex items-center gap-2 text-xs">
                <input type="radio" name="resultado" checked={resultado === r.id} onChange={() => setResultado(r.id)} /> {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Nota (opcional)</span>
          <textarea value={nota} onChange={e => setNota(e.target.value)} maxLength={2000} rows={2} className={campo} placeholder="Ej.: hablar con la secretaria después de las 3 p. m." /></label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-slate-600">Cancelar</button>
          <button type="submit" disabled={guardando} className={botonPrimario}>{guardando ? 'Guardando…' : 'Anotar llamada'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Historial({ c, onClose }: { c: ColegioContacto; onClose: () => void }) {
  const [items, setItems] = useState<RegistroContacto[] | null>(null);
  useEffect(() => { contactoColegiosApi.historial(c.id).then(setItems).catch(() => setItems([])); }, [c.id]);
  return (
    <Modal titulo={`Historial de ${c.nombre}`} onClose={onClose}>
      <div className="p-4 text-xs">
        {items === null ? <Cargando /> : items.length === 0 ? <p className="text-neutral-400">Todavía no hay contactos.</p> : (
          <ul className="space-y-2">
            {items.map(i => (
              <li key={i.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-bold text-slate-800">
                  {CANAL[i.canal] ?? i.canal}{i.resultado ? ` · ${RESULTADO[i.resultado] ?? i.resultado}` : ''}{i.automatico ? ' · automático' : ''}
                </p>
                {i.nota && <p className="whitespace-pre-line text-slate-600">{i.nota}</p>}
                <p className="text-neutral-400">{new Date(i.createdAt).toLocaleString('es-PE')}{i.autor ? ` · ${i.autor}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function ConfigMensaje({ onClose }: { onClose: () => void }) {
  const avisos = useAvisos();
  const [cfg, setCfg] = useState<ConfigContactoColegios | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [recordando, setRecordando] = useState(false);
  const [correoActivo, setCorreoActivo] = useState(false);
  useEffect(() => {
    contactoColegiosApi.config().then(r => { setCfg(r.config); setCorreoActivo(r.correoConfigurado); })
      .catch(e => avisos.error(e, 'No pudimos cargar la configuración'));
  }, [avisos]);
  if (!cfg) return <Modal titulo="Mensaje y recordatorios" onClose={onClose}><Cargando /></Modal>;
  const set = <K extends keyof ConfigContactoColegios>(k: K, v: ConfigContactoColegios[K]) => setCfg(x => (x ? { ...x, [k]: v } : x));
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try { const r = await contactoColegiosApi.guardarConfig(cfg); setCfg(r.config); avisos.exito('Configuración guardada'); onClose(); }
    catch (err) { avisos.error(err, 'No pudimos guardar'); }
    finally { setGuardando(false); }
  };
  const recordarAhora = async () => {
    setRecordando(true);
    try { const n = await contactoColegiosApi.enviarRecordatoriosPendientes(); avisos.exito(n ? `${n} recordatorio(s) enviados` : 'No había recordatorios pendientes'); }
    catch (err) { avisos.error(err, 'No pudimos enviar los recordatorios'); }
    finally { setRecordando(false); }
  };
  return (
    <Modal titulo="Mensaje y recordatorios" onClose={onClose} ancho="max-w-2xl">
      <form onSubmit={guardar} className="space-y-3 p-4 text-sm">
        <p className="text-xs text-slate-500">
          Puedes usar <code>{'{colegio}'}</code>, <code>{'{enlace}'}</code> (obligatorio en el mensaje), <code>{'{anio}'}</code> y <code>{'{contacto}'}</code>.
        </p>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Primer mensaje (WhatsApp y correo)</span>
          <textarea value={cfg.mensaje} onChange={e => set('mensaje', e.target.value)} maxLength={3000} rows={8} className={campo} /></label>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Recordatorio</span>
          <textarea value={cfg.recordatorio} onChange={e => set('recordatorio', e.target.value)} maxLength={3000} rows={4} className={campo} /></label>
        <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Asunto del correo</span>
          <input value={cfg.asunto} onChange={e => set('asunto', e.target.value)} maxLength={200} className={campo} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Días antes de recordar</span>
            <input type="number" min={1} max={60} value={cfg.diasRecordatorio} onChange={e => set('diasRecordatorio', Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))} className={campo} /></label>
          <label className="block"><span className="mb-1 block text-xs font-bold text-slate-600">Recordatorios por correo (máximo)</span>
            <input type="number" min={0} max={10} value={cfg.maxRecordatorios} onChange={e => set('maxRecordatorios', Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))} className={campo} /></label>
        </div>
        <Interruptor activo={cfg.recordatoriosAutomaticos} onChange={v => set('recordatoriosAutomaticos', v)} etiqueta="Enviar los recordatorios por correo automáticamente" />
        <p className="text-xs text-slate-500">Por WhatsApp no se puede enviar solo: los colegios a los que toca recordar aparecen en «Para recordar hoy».</p>
        <div className="flex flex-wrap justify-between gap-2 pt-1">
          <button type="button" onClick={recordarAhora} disabled={!correoActivo || recordando} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
            title={correoActivo ? undefined : 'El correo aún no está activo'}>
            {recordando ? 'Enviando…' : 'Enviar ahora los recordatorios pendientes'}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-slate-600">Cancelar</button>
            <button type="submit" disabled={guardando} className={botonPrimario}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
