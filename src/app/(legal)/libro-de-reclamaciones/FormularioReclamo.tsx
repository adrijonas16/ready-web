'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Printer } from 'lucide-react';
import { MODO_DEMO } from '@/lib/api-base';

// ── Datos ──

type TipoDoc = 'DNI' | 'CE' | 'PASAPORTE';
interface Datos {
  nombre: string; tipoDoc: TipoDoc; documento: string; domicilio: string; telefono: string; correo: string;
  esMenor: boolean;
  apoderadoNombre: string; apoderadoTipoDoc: TipoDoc; apoderadoDocumento: string; apoderadoDomicilio: string; apoderadoTelefono: string; apoderadoCorreo: string;
  bien: 'producto' | 'servicio' | '';
  monto: string; descripcionBien: string; pedido: string;
  tipo: 'reclamo' | 'queja' | '';
  detalle: string; pedidoConsumidor: string;
  acepto: boolean;
  /** Trampa para robots: las personas no la ven ni la llenan */
  sitioWeb: string;
}
type Campo = keyof Datos;

interface Hoja extends Omit<Datos, 'sitioWeb' | 'acepto'> { codigo: string; fecha: string }

const VACIO: Datos = {
  nombre: '', tipoDoc: 'DNI', documento: '', domicilio: '', telefono: '', correo: '',
  esMenor: false,
  apoderadoNombre: '', apoderadoTipoDoc: 'DNI', apoderadoDocumento: '', apoderadoDomicilio: '', apoderadoTelefono: '', apoderadoCorreo: '',
  bien: '', monto: '', descripcionBien: '', pedido: '', tipo: '', detalle: '', pedidoConsumidor: '', acepto: false, sitioWeb: '',
};

const CLAVE = 'ready-reclamos';
/** Tiempo mínimo para llenar la hoja: menos que esto suele ser un robot. */
const TIEMPO_MINIMO_MS = 3000;

// ── Validación ──

const docValido = (tipo: TipoDoc, v: string) =>
  tipo === 'DNI' ? /^\d{8}$/.test(v) : tipo === 'CE' ? /^[A-Za-z0-9]{8,12}$/.test(v) : /^[A-Za-z0-9]{6,12}$/.test(v);
const msjDoc = (tipo: TipoDoc) =>
  tipo === 'DNI' ? 'El DNI tiene 8 dígitos.' : tipo === 'CE' ? 'El carné de extranjería tiene de 8 a 12 letras o números.' : 'El pasaporte tiene de 6 a 12 letras o números.';
const soloDigitos = (v: string) => v.replace(/[\s\-().+]/g, '').replace(/^51(?=\d{9}$)/, '');
const correoValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function validar(d: Datos): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {};
  const t = (v: string) => v.trim();
  if (t(d.nombre).length < 5 || !/\s/.test(t(d.nombre))) e.nombre = 'Escribe tus nombres y apellidos.';
  if (!t(d.documento)) e.documento = 'Escribe el número de tu documento.';
  else if (!docValido(d.tipoDoc, t(d.documento))) e.documento = msjDoc(d.tipoDoc);
  if (t(d.domicilio).length < 8) e.domicilio = 'Escribe tu domicilio: calle, número y distrito.';
  if (!/^\d{7,9}$/.test(soloDigitos(d.telefono))) e.telefono = 'Escribe un teléfono de 7 a 9 dígitos, por ejemplo 987 654 321.';
  if (!correoValido(d.correo)) e.correo = 'Escribe un correo válido: ahí te enviaremos la copia y la respuesta.';
  if (d.esMenor) {
    if (t(d.apoderadoNombre).length < 5 || !/\s/.test(t(d.apoderadoNombre))) e.apoderadoNombre = 'Escribe los nombres y apellidos del padre, madre o apoderado.';
    if (!docValido(d.apoderadoTipoDoc, t(d.apoderadoDocumento))) e.apoderadoDocumento = msjDoc(d.apoderadoTipoDoc);
    if (t(d.apoderadoDomicilio).length < 8) e.apoderadoDomicilio = 'Escribe el domicilio del apoderado.';
    if (!/^\d{7,9}$/.test(soloDigitos(d.apoderadoTelefono))) e.apoderadoTelefono = 'Escribe un teléfono de 7 a 9 dígitos.';
    if (!correoValido(d.apoderadoCorreo)) e.apoderadoCorreo = 'Escribe un correo válido del apoderado.';
  }
  if (!d.bien) e.bien = 'Elige si es un producto o un servicio.';
  if (t(d.monto)) {
    const n = Number(t(d.monto).replace(',', '.'));
    if (!/^\d{1,6}([.,]\d{1,2})?$/.test(t(d.monto)) || !(n >= 0)) e.monto = 'Escribe el monto en soles, por ejemplo 45.90.';
  }
  if (t(d.descripcionBien).length < 3) e.descripcionBien = 'Describe el producto o servicio (por ejemplo, «Lista 2do Primaria»).';
  if (t(d.pedido) && !/^[A-Za-z0-9-]{3,20}$/.test(t(d.pedido))) e.pedido = 'El número de pedido solo lleva letras, números y guiones (por ejemplo RD-1001).';
  if (!d.tipo) e.tipo = 'Elige si es un reclamo o una queja.';
  if (t(d.detalle).length < 20) e.detalle = 'Cuéntanos qué pasó con un poco más de detalle (mínimo 20 caracteres).';
  if (t(d.pedidoConsumidor).length < 5) e.pedidoConsumidor = 'Indica qué solución esperas (por ejemplo, cambio o devolución).';
  if (!d.acepto) e.acepto = 'Marca la casilla para confirmar la hoja.';
  return e;
}

/** Siguiente código correlativo del año: R-2026-0001. */
function guardarHoja(d: Datos): Hoja {
  const ahora = new Date();
  let hojas: Hoja[] = [];
  try { hojas = JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { /* lista dañada */ }
  const año = ahora.getFullYear();
  const n = hojas.filter(h => h.codigo.startsWith(`R-${año}-`)).length + 1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sitioWeb, acepto, ...resto } = d;
  const hoja: Hoja = { ...resto, codigo: `R-${año}-${String(n).padStart(4, '0')}`, fecha: ahora.toISOString() };
  try { localStorage.setItem(CLAVE, JSON.stringify([...hojas, hoja])); } catch { /* sin espacio: igual se muestra */ }
  return hoja;
}

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });

// ── Piezas ──

const campoCss = (error?: string) =>
  `mt-1 w-full rounded-xl border-2 bg-papel px-3.5 py-2.5 text-grafito outline-none transition-colors focus:border-primario ${error ? 'border-profe' : 'border-slate-300'}`;

function Fila({ id, etiqueta, error, ayuda, opcional, children }: {
  id: string; etiqueta: string; error?: string; ayuda?: string; opcional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold">
        {etiqueta} {opcional ? <span className="font-normal text-tenue">(opcional)</span> : <span aria-hidden="true" className="text-profe">*</span>}
      </label>
      {children}
      {ayuda && !error && <p id={`${id}-ayuda`} className="mt-1 text-xs text-tenue">{ayuda}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-profe">{error}</p>}
    </div>
  );
}

// ── Formulario ──

export default function FormularioReclamo() {
  const [d, setD] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [aviso, setAviso] = useState('');
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inicio = useRef(0);
  const resumen = useRef<HTMLDivElement>(null);
  const tituloHoja = useRef<HTMLHeadingElement>(null);
  const uid = useId();
  const id = (c: string) => `${uid}-${c}`;

  useEffect(() => { inicio.current = Date.now(); }, []);
  useEffect(() => { if (hoja) tituloHoja.current?.focus(); }, [hoja]);

  const set = <K extends Campo>(c: K, v: Datos[K]) => {
    setD(prev => ({ ...prev, [c]: v }));
    if (errores[c]) setErrores(prev => { const n = { ...prev }; delete n[c]; return n; });
  };

  /** Props comunes de cada campo: id, valor, error accesible. */
  const props = (c: Campo, ayuda = false) => ({
    id: id(c), name: c, value: d[c] as string,
    'aria-invalid': errores[c] ? true : undefined,
    'aria-describedby': errores[c] ? `${id(c)}-error` : ayuda ? `${id(c)}-ayuda` : undefined,
    className: campoCss(errores[c]),
  });

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAviso('');
    // Robot: llenó el campo oculto. Se le muestra un "éxito" sin guardar nada.
    if (d.sitioWeb) { setHoja({ ...VACIO, codigo: 'R-0000-0000', fecha: new Date().toISOString() }); return; }
    const e = validar(d);
    setErrores(e);
    if (Object.keys(e).length) {
      setTimeout(() => resumen.current?.focus(), 0);
      return;
    }
    if (Date.now() - inicio.current < TIEMPO_MINIMO_MS) {
      setAviso('Revisa tus datos un momento y vuelve a enviar la hoja.');
      setTimeout(() => resumen.current?.focus(), 0);
      return;
    }
    setEnviando(true);
    await new Promise(r => setTimeout(r, 400));
    setHoja(guardarHoja(d));
    setEnviando(false);
    window.scrollTo({ top: 0 });
  };

  if (hoja) return <HojaRegistrada hoja={hoja} tituloRef={tituloHoja} onOtra={() => { setD(VACIO); setHoja(null); setErrores({}); inicio.current = Date.now(); }} />;

  const listaErrores = Object.entries(errores) as [Campo, string][];
  const radio = 'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 has-[:checked]:border-primario has-[:checked]:bg-primario-claro has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primario';

  return (
    <form onSubmit={enviar} noValidate className="mt-6 space-y-8" aria-describedby={id('obligatorios')}>
      <p id={id('obligatorios')} className="text-sm text-tenue">Los campos con <span className="text-profe">*</span> son obligatorios.</p>

      <div ref={resumen} tabIndex={-1} aria-live="assertive" className="outline-none">
        {listaErrores.length > 0 && (
          <div className="rounded-2xl border-2 border-profe bg-profe-claro p-4" role="alert">
            <p className="font-bold text-profe">Revisa {listaErrores.length === 1 ? 'este dato' : `estos ${listaErrores.length} datos`}:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {listaErrores.map(([c, m]) => <li key={c}><a href={`#${id(c)}`} className="font-semibold text-grafito underline">{m}</a></li>)}
            </ul>
          </div>
        )}
        {aviso && <p role="alert" className="rounded-2xl border-2 border-acento-oscuro bg-acento-claro p-4 font-semibold">{aviso}</p>}
      </div>

      {/* Trampa para robots: fuera de la vista y del orden de tabulación */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id('sitioWeb')}>No llenes este campo</label>
        <input id={id('sitioWeb')} name="sitio_web" tabIndex={-1} autoComplete="off" value={d.sitioWeb} onChange={e => set('sitioWeb', e.target.value)} />
      </div>

      <fieldset className="rounded-2xl border border-linea bg-papel p-5 sm:p-6">
        <legend className="px-2 font-display text-lg font-bold">1. Identificación del consumidor</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Fila id={id('nombre')} etiqueta="Nombres y apellidos" error={errores.nombre}>
              <input {...props('nombre')} autoComplete="name" onChange={e => set('nombre', e.target.value)} />
            </Fila>
          </div>
          <Fila id={id('tipoDoc')} etiqueta="Tipo de documento">
            <select {...props('tipoDoc')} onChange={e => set('tipoDoc', e.target.value as TipoDoc)}>
              <option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="PASAPORTE">Pasaporte</option>
            </select>
          </Fila>
          <Fila id={id('documento')} etiqueta="Número de documento" error={errores.documento}>
            <input {...props('documento')} inputMode={d.tipoDoc === 'DNI' ? 'numeric' : 'text'} maxLength={12} onChange={e => set('documento', e.target.value.trim())} />
          </Fila>
          <div className="sm:col-span-2">
            <Fila id={id('domicilio')} etiqueta="Domicilio" error={errores.domicilio}>
              <input {...props('domicilio')} autoComplete="street-address" onChange={e => set('domicilio', e.target.value)} />
            </Fila>
          </div>
          <Fila id={id('telefono')} etiqueta="Teléfono" error={errores.telefono}>
            <input {...props('telefono')} type="tel" autoComplete="tel" inputMode="tel" onChange={e => set('telefono', e.target.value)} />
          </Fila>
          <Fila id={id('correo')} etiqueta="Correo electrónico" error={errores.correo} ayuda="Te enviaremos una copia de esta hoja y la respuesta.">
            <input {...props('correo', true)} type="email" autoComplete="email" onChange={e => set('correo', e.target.value)} />
          </Fila>
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={d.esMenor} onChange={e => set('esMenor', e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-primario" aria-controls={id('apoderado')} aria-expanded={d.esMenor} />
          <span><span className="font-bold">Soy menor de edad.</span> <span className="text-tenue">Completa los datos de tu padre, madre o apoderado.</span></span>
        </label>
        {d.esMenor && (
          <div id={id('apoderado')} className="mt-4 grid gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:grid-cols-2">
            <p className="font-bold sm:col-span-2">Padre, madre o apoderado</p>
            <div className="sm:col-span-2">
              <Fila id={id('apoderadoNombre')} etiqueta="Nombres y apellidos" error={errores.apoderadoNombre}>
                <input {...props('apoderadoNombre')} onChange={e => set('apoderadoNombre', e.target.value)} />
              </Fila>
            </div>
            <Fila id={id('apoderadoTipoDoc')} etiqueta="Tipo de documento">
              <select {...props('apoderadoTipoDoc')} onChange={e => set('apoderadoTipoDoc', e.target.value as TipoDoc)}>
                <option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="PASAPORTE">Pasaporte</option>
              </select>
            </Fila>
            <Fila id={id('apoderadoDocumento')} etiqueta="Número de documento" error={errores.apoderadoDocumento}>
              <input {...props('apoderadoDocumento')} maxLength={12} onChange={e => set('apoderadoDocumento', e.target.value.trim())} />
            </Fila>
            <div className="sm:col-span-2">
              <Fila id={id('apoderadoDomicilio')} etiqueta="Domicilio" error={errores.apoderadoDomicilio}>
                <input {...props('apoderadoDomicilio')} onChange={e => set('apoderadoDomicilio', e.target.value)} />
              </Fila>
            </div>
            <Fila id={id('apoderadoTelefono')} etiqueta="Teléfono" error={errores.apoderadoTelefono}>
              <input {...props('apoderadoTelefono')} type="tel" inputMode="tel" onChange={e => set('apoderadoTelefono', e.target.value)} />
            </Fila>
            <Fila id={id('apoderadoCorreo')} etiqueta="Correo electrónico" error={errores.apoderadoCorreo}>
              <input {...props('apoderadoCorreo')} type="email" onChange={e => set('apoderadoCorreo', e.target.value)} />
            </Fila>
          </div>
        )}
      </fieldset>

      <fieldset className="rounded-2xl border border-linea bg-papel p-5 sm:p-6">
        <legend className="px-2 font-display text-lg font-bold">2. Identificación del bien contratado</legend>
        <div role="radiogroup" aria-labelledby={id('bien-t')} aria-describedby={errores.bien ? `${id('bien')}-error` : undefined} className="space-y-2">
          <p id={id('bien-t')} className="text-sm font-bold">¿Es un producto o un servicio? <span aria-hidden="true" className="text-profe">*</span></p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['producto', 'servicio'] as const).map((v, i) => (
              <label key={v} className={`${radio} ${errores.bien ? 'border-profe' : 'border-slate-300'}`}>
                <input type="radio" name="bien" id={i === 0 ? id('bien') : undefined} value={v} checked={d.bien === v} onChange={() => set('bien', v)} className="h-4 w-4 accent-primario" aria-invalid={errores.bien ? true : undefined} />
                {v === 'producto' ? 'Producto (útiles, libros…)' : 'Servicio (entrega, forrado, etiquetas…)'}
              </label>
            ))}
          </div>
          {errores.bien && <p id={`${id('bien')}-error`} className="text-sm font-semibold text-profe">{errores.bien}</p>}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Fila id={id('monto')} etiqueta="Monto reclamado (S/)" error={errores.monto} opcional ayuda="Si tu reclamo es por dinero, indica cuánto.">
            <input {...props('monto', true)} inputMode="decimal" placeholder="0.00" onChange={e => set('monto', e.target.value)} />
          </Fila>
          <Fila id={id('pedido')} etiqueta="Número de pedido" error={errores.pedido} opcional ayuda="Lo ves en Mis listas y pedidos, por ejemplo RD-1001.">
            <input {...props('pedido', true)} onChange={e => set('pedido', e.target.value.toUpperCase())} />
          </Fila>
          <div className="sm:col-span-2">
            <Fila id={id('descripcionBien')} etiqueta="Descripción del producto o servicio" error={errores.descripcionBien}>
              <input {...props('descripcionBien')} onChange={e => set('descripcionBien', e.target.value)} />
            </Fila>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-linea bg-papel p-5 sm:p-6">
        <legend className="px-2 font-display text-lg font-bold">3. Detalle de la reclamación y pedido del consumidor</legend>
        <div role="radiogroup" aria-labelledby={id('tipo-t')} aria-describedby={errores.tipo ? `${id('tipo')}-error` : undefined} className="space-y-2">
          <p id={id('tipo-t')} className="text-sm font-bold">Tipo <span aria-hidden="true" className="text-profe">*</span></p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`${radio} ${errores.tipo ? 'border-profe' : 'border-slate-300'} items-start`}>
              <input type="radio" name="tipo" id={id('tipo')} value="reclamo" checked={d.tipo === 'reclamo'} onChange={() => set('tipo', 'reclamo')} className="mt-1 h-4 w-4 accent-primario" aria-invalid={errores.tipo ? true : undefined} />
              <span><strong>Reclamo:</strong> <span className="text-sm text-tenue">disconformidad con los productos o servicios.</span></span>
            </label>
            <label className={`${radio} ${errores.tipo ? 'border-profe' : 'border-slate-300'} items-start`}>
              <input type="radio" name="tipo" value="queja" checked={d.tipo === 'queja'} onChange={() => set('tipo', 'queja')} className="mt-1 h-4 w-4 accent-primario" />
              <span><strong>Queja:</strong> <span className="text-sm text-tenue">malestar con la atención al público, no relacionado con los productos o servicios.</span></span>
            </label>
          </div>
          {errores.tipo && <p id={`${id('tipo')}-error`} className="text-sm font-semibold text-profe">{errores.tipo}</p>}
        </div>
        <div className="mt-4 space-y-4">
          <Fila id={id('detalle')} etiqueta="Detalle" error={errores.detalle} ayuda="Qué pasó, cuándo y con qué pedido o producto.">
            <textarea {...props('detalle', true)} rows={5} maxLength={2000} onChange={e => set('detalle', e.target.value)} />
          </Fila>
          <Fila id={id('pedidoConsumidor')} etiqueta="Pedido del consumidor" error={errores.pedidoConsumidor} ayuda="Qué solución esperas: cambio, devolución, completar el pedido…">
            <textarea {...props('pedidoConsumidor', true)} rows={3} maxLength={1000} onChange={e => set('pedidoConsumidor', e.target.value)} />
          </Fila>
        </div>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input id={id('acepto')} type="checkbox" checked={d.acepto} onChange={e => set('acepto', e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-primario"
            aria-invalid={errores.acepto ? true : undefined} aria-describedby={errores.acepto ? `${id('acepto')}-error` : undefined} />
          <span>
            Declaro que los datos son verdaderos y confirmo el contenido de esta hoja de reclamación. Sus datos se tratan según la{' '}
            <Link href="/privacidad" className="font-semibold text-primario underline underline-offset-2">Política de privacidad</Link>. <span aria-hidden="true" className="text-profe">*</span>
          </span>
        </label>
        {errores.acepto && <p id={`${id('acepto')}-error`} className="mt-1 text-sm font-semibold text-profe">{errores.acepto}</p>}
      </div>

      <button type="submit" disabled={enviando}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primario px-6 py-3 font-bold text-white hover:bg-primario-oscuro disabled:cursor-wait disabled:opacity-70 sm:w-auto">
        {enviando ? 'Registrando…' : 'Enviar hoja de reclamación'}
      </button>
    </form>
  );
}

// ── Hoja registrada ──

function HojaRegistrada({ hoja, onOtra, tituloRef }: { hoja: Hoja; onOtra: () => void; tituloRef: React.RefObject<HTMLHeadingElement | null> }) {
  const doc = (t: TipoDoc) => (t === 'CE' ? 'C.E.' : t === 'PASAPORTE' ? 'Pasaporte' : 'DNI');
  const filas: [string, string][] = [
    ['Consumidor', hoja.nombre],
    ['Documento', `${doc(hoja.tipoDoc)} ${hoja.documento}`],
    ['Domicilio', hoja.domicilio],
    ['Teléfono', hoja.telefono],
    ['Correo', hoja.correo],
    ...(hoja.esMenor ? [['Padre, madre o apoderado', `${hoja.apoderadoNombre} (${doc(hoja.apoderadoTipoDoc)} ${hoja.apoderadoDocumento}) · ${hoja.apoderadoTelefono} · ${hoja.apoderadoCorreo} · ${hoja.apoderadoDomicilio}`] as [string, string]] : []),
    ['Bien contratado', `${hoja.bien === 'servicio' ? 'Servicio' : 'Producto'}: ${hoja.descripcionBien}`],
    ['Monto reclamado', hoja.monto ? `S/ ${Number(hoja.monto.replace(',', '.')).toFixed(2)}` : '—'],
    ['Pedido', hoja.pedido || '—'],
    ['Tipo', hoja.tipo === 'queja' ? 'Queja' : 'Reclamo'],
    ['Detalle', hoja.detalle],
    ['Pedido del consumidor', hoja.pedidoConsumidor],
  ];
  return (
    <section aria-labelledby="hoja-titulo" className="mt-6 rounded-2xl border-2 border-eco bg-papel p-5 sm:p-7">
      <p className="flex items-center gap-2 font-bold text-eco"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Hoja registrada</p>
      <h2 id="hoja-titulo" ref={tituloRef} tabIndex={-1} className="mt-2 font-display text-2xl font-extrabold outline-none">
        Hoja de reclamación N.° <span className="whitespace-nowrap">{hoja.codigo}</span>
      </h2>
      <p className="mt-1 text-sm text-tenue">Fecha: {fechaHora(hoja.fecha)}</p>
      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[12rem_1fr]">
        {filas.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-bold">{k}</dt>
            <dd className="whitespace-pre-line break-words text-grafito">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 space-y-2 rounded-xl bg-fondo p-4 text-sm">
        <p>Te responderemos en un plazo no mayor de <strong>15 días hábiles</strong>.</p>
        <p>La formulación del reclamo no impide acudir a otras vías de solución de controversias.</p>
        {MODO_DEMO
          ? <p><strong>Demostración:</strong> esta hoja se guardó solo en tu navegador y no se envió a nadie. En la tienda real recibirías una copia en tu correo.</p>
          : <p>Enviamos una copia de esta hoja a tu correo.</p>}
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row print:hidden">
        <button type="button" onClick={() => window.print()}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primario px-5 py-2.5 font-bold text-white hover:bg-primario-oscuro">
          <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir o guardar en PDF
        </button>
        <button type="button" onClick={onOtra} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 border-grafito px-5 py-2.5 font-bold hover:bg-fondo">
          Registrar otra hoja
        </button>
      </div>
    </section>
  );
}
