'use client';

import { useState, ReactNode } from 'react';
import { BookOpen, Tag, NotebookPen, FileText, Plus, Trash2, Minus, Star, Flower2, Rocket, Trophy, Heart, Circle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { ListBook, ListExtras, Product } from '@/lib/types';
import { OpcionesServicios, buscarOpcion, precioServicio } from '@/lib/lista';

export interface ConteoExtras {
  cuadernos: number;
  libros: number;
  etiquetas: number;
  caratulas: number;
}

export interface PreciosServicios {
  forroCuaderno?: Product;
  forroLibro?: Product;
  etiqueta?: Product;
  caratula?: Product;
}

const ICONO_DISENO: Record<string, typeof Star> = {
  lisa: Circle, estrellas: Star, flores: Flower2, espacio: Rocket, deportes: Trophy, corazones: Heart,
};

function Interruptor({ activo, onChange, etiqueta }: { activo: boolean; onChange: (v: boolean) => void; etiqueta: string }) {
  return (
    <button role="switch" aria-checked={activo} aria-label={etiqueta} onClick={() => onChange(!activo)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${activo ? 'bg-primario' : 'bg-linea'}`}>
      <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function Tarjeta({ icono, titulo, detalle, monto, activo, onToggle, children }: {
  icono: ReactNode; titulo: string; detalle: string; monto?: number | null;
  activo?: boolean; onToggle?: (v: boolean) => void; children?: ReactNode;
}) {
  const abierto = onToggle ? activo : true;
  return (
    <div className={`rounded-2xl border bg-papel transition-colors ${abierto && onToggle ? 'border-primario/40' : 'border-linea'}`}>
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-acento-claro text-acento-oscuro">{icono}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight">{titulo}</h3>
          <p className="text-sm text-tenue">{detalle}</p>
        </div>
        {abierto && monto != null && monto > 0 && <span className="font-bold tabular-nums">{formatPrice(monto)}</span>}
        {onToggle && <Interruptor activo={!!activo} onChange={onToggle} etiqueta={titulo} />}
      </div>
      {abierto && children && <div className="border-t border-linea px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

const precio = (p?: Product) => (p ? formatPrice(p.basePrice) : 'precio por confirmar');

export default function Extras({ extras, onChange, conteo, servicios, opciones }: {
  extras: ListExtras;
  onChange: (e: ListExtras) => void;
  conteo: ConteoExtras;
  servicios: PreciosServicios;
  opciones: OpcionesServicios;
}) {
  const [cursoNuevo, setCursoNuevo] = useState('');
  const set = (patch: Partial<ListExtras>) => onChange({ ...extras, ...patch });
  const setLibro = (id: string, patch: Partial<ListBook>) =>
    set({ libros: extras.libros.map(l => (l.id === id ? { ...l, ...patch } : l)) });

  const colorElegido = buscarOpcion(opciones.colores, extras.forro.color);
  const disenoElegido = buscarOpcion(opciones.disenos, extras.etiquetas.diseno);
  const montoForro = precioServicio(servicios.forroCuaderno, colorElegido) * conteo.cuadernos
    + (extras.forrarLibros ? (servicios.forroLibro?.basePrice ?? 0) * conteo.libros : 0);
  const cursos = Array.from(new Set([...opciones.cursos, ...extras.caratulas.cursos]));
  const librosConPrecio = extras.libros.reduce((s, l) => s + (l.precio ? l.precio * l.cantidad : 0), 0);
  const porCotizar = extras.libros.filter(l => !l.precio).length;

  return (
    <section aria-labelledby="extras" className="space-y-3">
      <div>
        <h2 id="extras" className="text-2xl font-extrabold tracking-tight">Agrega lo que necesites</h2>
        <p className="text-tenue">Lo dejamos listo para que solo lo lleve al colegio.</p>
      </div>

      {/* Forrado */}
      <Tarjeta icono={<NotebookPen className="h-5 w-5" />} titulo="Forrado de cuadernos"
        detalle={`${precio(servicios.forroCuaderno)} por cuaderno, ${conteo.cuadernos} ${conteo.cuadernos === 1 ? 'cuaderno' : 'cuadernos'}`}
        monto={montoForro} activo={extras.forro.activo} onToggle={v => set({ forro: { ...extras.forro, activo: v } })}>
        <p className="mb-2 text-sm font-semibold">Color del forro</p>
        <div className="flex flex-wrap gap-2">
          {opciones.colores.map(c => {
            const activo = colorElegido?.nombre === c.nombre;
            return (
              <button key={c.nombre} onClick={() => set({ forro: { ...extras.forro, color: c.nombre } })} aria-pressed={activo}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${activo ? 'border-grafito bg-fondo font-semibold' : 'border-linea hover:border-tenue'}`}>
                {c.imagen
                  ? <img src={c.imagen} alt="" width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
                  : <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.hex || 'repeating-linear-gradient(45deg,#fff 0 3px,#E4ECFC 3px 6px)' }} aria-hidden="true" />}
                {c.nombre}{c.recargo > 0 && <span className="text-tenue">+{formatPrice(c.recargo)}</span>}
              </button>
            );
          })}
        </div>
        {conteo.libros > 0 && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-primario" checked={extras.forrarLibros} onChange={e => set({ forrarLibros: e.target.checked })} />
            Forrar también los {conteo.libros} libros ({precio(servicios.forroLibro)} c/u)
          </label>
        )}
      </Tarjeta>

      {/* Etiquetas */}
      <Tarjeta icono={<Tag className="h-5 w-5" />} titulo="Etiquetas personalizadas"
        detalle={`${precio(servicios.etiqueta)} c/u, ${conteo.etiquetas} etiquetas para cuadernos y libros`}
        monto={precioServicio(servicios.etiqueta, disenoElegido) * conteo.etiquetas}
        activo={extras.etiquetas.activo} onToggle={v => set({ etiquetas: { ...extras.etiquetas, activo: v } })}>
        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Nombre en la etiqueta</span>
            <input value={extras.etiquetas.nombre} onChange={e => set({ etiquetas: { ...extras.etiquetas, nombre: e.target.value } })}
              name="etiqueta-nombre" autoComplete="off" placeholder="Ej.: Lucía Quispe…" className="w-full rounded-xl border border-linea px-3 py-2 focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Grado y sección</span>
            <input value={extras.etiquetas.grado} onChange={e => set({ etiquetas: { ...extras.etiquetas, grado: e.target.value } })}
              name="etiqueta-grado" autoComplete="off" placeholder="Ej.: 2.º B…" className="w-full rounded-xl border border-linea px-3 py-2 focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" />
          </label>
        </div>
        <p className="mb-2 mt-3 text-sm font-semibold">Diseño</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {opciones.disenos.map(d => {
            const Icono = ICONO_DISENO[d.nombre.toLowerCase()] ?? Tag;
            const activo = disenoElegido?.nombre === d.nombre;
            return (
              <button key={d.nombre} onClick={() => set({ etiquetas: { ...extras.etiquetas, diseno: d.nombre } })} aria-pressed={activo}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-1.5 text-xs ${activo ? 'border-primario bg-primario-claro font-semibold' : 'border-linea hover:border-tenue'}`}>
                {d.imagen
                  ? <img src={d.imagen} alt="" width={64} height={40} className="h-10 w-full rounded-md object-cover" />
                  : <span className="flex h-10 items-center"><Icono className="h-5 w-5 text-acento-oscuro" aria-hidden="true" /></span>}
                <span className="w-full truncate text-center">{d.nombre}</span>
                {d.recargo > 0 && <span className="text-tenue">+{formatPrice(d.recargo)}</span>}
              </button>
            );
          })}
        </div>
      </Tarjeta>

      {/* Carátulas */}
      <Tarjeta icono={<FileText className="h-5 w-5" />} titulo="Carátulas por curso"
        detalle={`${precio(servicios.caratula)} por curso${extras.caratulas.activo ? `, ${conteo.caratulas} elegidos` : ''}`}
        monto={(servicios.caratula?.basePrice ?? 0) * conteo.caratulas}
        activo={extras.caratulas.activo} onToggle={v => set({ caratulas: { ...extras.caratulas, activo: v } })}>
        <p className="mb-2 text-sm font-semibold">¿Para qué cursos?</p>
        <div className="flex flex-wrap gap-2">
          {cursos.map(c => {
            const activo = extras.caratulas.cursos.includes(c);
            return (
              <button key={c} aria-pressed={activo}
                onClick={() => set({ caratulas: { ...extras.caratulas, cursos: activo ? extras.caratulas.cursos.filter(x => x !== c) : [...extras.caratulas.cursos, c] } })}
                className={`rounded-full border px-3 py-1 text-sm ${activo ? 'border-primario bg-primario text-white' : 'border-linea hover:border-tenue'}`}>
                {c}
              </button>
            );
          })}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={e => {
          e.preventDefault();
          const c = cursoNuevo.trim();
          if (c && !extras.caratulas.cursos.includes(c)) set({ caratulas: { ...extras.caratulas, cursos: [...extras.caratulas.cursos, c] } });
          setCursoNuevo('');
        }}>
          <input value={cursoNuevo} onChange={e => setCursoNuevo(e.target.value)} name="curso" autoComplete="off" aria-label="Otro curso" placeholder="Otro curso, ej.: Robótica…"
            className="min-w-0 flex-1 rounded-xl border border-linea px-3 py-2 text-sm focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" />
          <button className="rounded-xl border border-linea px-3 text-sm font-semibold hover:border-tenue">Agregar</button>
        </form>
      </Tarjeta>

      {/* Libros */}
      <Tarjeta icono={<BookOpen className="h-5 w-5" />} titulo="Libros"
        detalle={extras.libros.length === 0 ? 'Escribe los libros que pide el colegio y te los conseguimos' : `${conteo.libros} ${conteo.libros === 1 ? 'libro' : 'libros'}${porCotizar ? `, ${porCotizar} por cotizar` : ''}`}
        monto={librosConPrecio}>
        <ul className="space-y-2">
          {extras.libros.map(l => (
            <li key={l.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.4fr_1fr_auto_auto_auto] sm:items-center">
              <input value={l.titulo} onChange={e => setLibro(l.id, { titulo: e.target.value, productoId: null, precio: null })} name="libro-titulo" autoComplete="off" placeholder="Título del libro…"
                className="min-w-0 rounded-xl border border-linea px-3 py-2 text-sm focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" aria-label="Título del libro" />
              <button onClick={() => set({ libros: extras.libros.filter(x => x.id !== l.id) })} className="rounded-lg p-2 text-tenue hover:text-profe sm:order-last" aria-label={`Quitar ${l.titulo || 'libro'}`}>
                <Trash2 className="h-4 w-4" />
              </button>
              <input value={l.editorial} onChange={e => setLibro(l.id, { editorial: e.target.value })} name="libro-editorial" autoComplete="off" placeholder="Editorial o autor…"
                className="min-w-0 rounded-xl border border-linea px-3 py-2 text-sm focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" aria-label="Editorial" />
              <div className="flex items-center justify-between gap-3 sm:contents">
                <div className="flex items-center rounded-lg border border-linea" aria-label="Cantidad">
                  <button onClick={() => setLibro(l.id, { cantidad: Math.max(1, l.cantidad - 1) })} className="p-1.5" aria-label="Uno menos"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center text-sm font-bold">{l.cantidad}</span>
                  <button onClick={() => setLibro(l.id, { cantidad: Math.min(20, l.cantidad + 1) })} className="p-1.5" aria-label="Uno más"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className={`w-24 text-right text-sm ${l.precio ? 'font-bold tabular-nums' : 'text-tenue'}`}>
                  {l.precio ? formatPrice(l.precio * l.cantidad) : 'Por cotizar'}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={() => set({ libros: [...extras.libros, { id: `l-${Date.now()}`, titulo: '', editorial: '', cantidad: 1 }] })}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-tenue/50 px-3 py-2 text-sm font-semibold text-primario hover:border-primario">
          <Plus className="h-4 w-4" aria-hidden="true" /> Agregar libro
        </button>
        {porCotizar > 0 && <p className="mt-2 text-sm text-tenue">Los libros por cotizar no se cobran ahora: te confirmamos el precio antes de enviar el pedido.</p>}
      </Tarjeta>
    </section>
  );
}
