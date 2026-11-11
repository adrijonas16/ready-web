'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, MessageCircleQuestionMark } from 'lucide-react';
import { consultasApi } from '@/services/api';
import { useAuth } from '@/lib/auth-context';
import { useAntiSpam } from '@/lib/antispam';
import { mensajeError } from '@/lib/api-base';
import { guardarConsulta, HORAS_RESPUESTA } from '@/lib/consultas';
import { LARGO, ariaCampo, limpiarCelular, validarNombre, validarTexto } from '@/lib/validar';
import { AvisoError, Campo, CampoTrampa, claseInput } from '@/components/form/Campo';
import type { Consulta } from '@/lib/types';

const MAX_PRODUCTO = 200;
const MAX_DETALLE = 1000;

/** Correo o celular peruano de 9 dígitos (igual que la API). */
function validarContacto(v: string): string | null {
  const t = v.trim();
  if (!t) return 'Escribe un correo o un celular para avisarte.';
  if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? null : 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  return /^9\d{8}$/.test(limpiarCelular(t)) ? null : 'Escribe un celular de 9 dígitos que empiece con 9, o un correo.';
}

/**
 * "¿Lo pueden conseguir?": el cliente pregunta por un producto que no está en la tienda.
 * La tienda averigua y responde sí o no dentro de las 24 horas.
 */
export default function ConsultarProducto({ productoInicial = '', supplyListId, compacto = false, onEnviada }: {
  productoInicial?: string;
  /** Lista desde la que se pregunta, para ubicarla al responder */
  supplyListId?: string;
  /** Sin el título grande (dentro de otro panel) */
  compacto?: boolean;
  onEnviada?: (c: Consulta) => void;
}) {
  const { user } = useAuth();
  const anti = useAntiSpam('consulta');
  const base = useId();
  const [producto, setProducto] = useState(productoInicial);
  const [detalle, setDetalle] = useState('');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState<Consulta | null>(null);

  const id = (campo: string) => `${base}-${campo}`;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const nuevos = {
      producto: validarTexto(producto, { campo: 'qué producto buscas', min: 2, max: MAX_PRODUCTO }),
      detalle: validarTexto(detalle, { obligatorio: false, max: MAX_DETALLE }),
      nombre: user ? null : validarNombre(nombre),
      contacto: user ? null : validarContacto(contacto),
    };
    setErrores(nuevos);
    setErrorServidor('');
    if (Object.values(nuevos).some(Boolean)) return;
    const limite = anti.revisar();
    if (limite) { setErrorServidor(limite); return; }

    setEnviando(true);
    try {
      const c = await consultasApi.crear({
        producto: producto.trim(), detalle: detalle.trim() || undefined, supplyListId,
        ...(user ? {} : { nombre: nombre.trim(), contacto: contacto.trim() }),
      }, await anti.datos());
      anti.anotar();
      if (!user) guardarConsulta(c.id);
      setEnviada(c);
      onEnviada?.(c);
    } catch (err) {
      setErrorServidor(mensajeError(err, 'No pudimos enviar tu consulta. Inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  };

  if (enviada) {
    const vence = new Date(enviada.venceAt).toLocaleString('es-PE', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    return (
      <div role="status" className="rounded-2xl border border-eco/40 bg-eco-claro px-4 py-4 text-left">
        <p className="flex items-center gap-2 font-bold text-grafito"><CheckCircle2 className="h-5 w-5 text-eco" aria-hidden="true" /> Recibimos tu consulta</p>
        <p className="mt-1 text-sm text-grafito">
          Averiguamos si conseguimos <b>{enviada.producto}</b> y te respondemos antes del {vence}.
          {user ? ' Te avisamos aquí en la tienda.' : ' Te escribimos al contacto que nos dejaste.'}
        </p>
        <Link href="/consultas" className="mt-2 inline-block text-sm font-semibold text-primario underline underline-offset-2">Ver mis consultas</Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="relative space-y-3 text-left" aria-labelledby={compacto ? undefined : id('titulo')}>
      <CampoTrampa {...anti.trampa} sufijo="consulta" />
      {!compacto && (
        <div>
          <h2 id={id('titulo')} className="flex items-center gap-2 text-lg font-bold">
            <MessageCircleQuestionMark className="h-5 w-5 text-primario" aria-hidden="true" /> ¿No lo encuentras? Pregúntanos
          </h2>
          <p className="text-sm text-tenue">Averiguamos si lo podemos conseguir y te respondemos en menos de {HORAS_RESPUESTA} horas.</p>
        </div>
      )}
      <Campo id={id('producto')} etiqueta="¿Qué producto buscas?" obligatorio error={errores.producto}>
        <input id={id('producto')} value={producto} onChange={e => setProducto(e.target.value)} maxLength={MAX_PRODUCTO}
          placeholder="Ej.: Plastilina Jovi de 12 colores" autoComplete="off" className={claseInput(errores.producto)} {...ariaCampo(id('producto'), errores.producto)} />
      </Campo>
      <Campo id={id('detalle')} etiqueta="Detalles" opcional error={errores.detalle} ayuda="Marca, color, medida o cantidad, si importa.">
        <textarea id={id('detalle')} value={detalle} onChange={e => setDetalle(e.target.value)} maxLength={MAX_DETALLE} rows={2}
          className={claseInput(errores.detalle, 'resize-y')} {...ariaCampo(id('detalle'), errores.detalle, true)} />
      </Campo>
      {!user && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo id={id('nombre')} etiqueta="Tu nombre" obligatorio error={errores.nombre}>
            <input id={id('nombre')} value={nombre} onChange={e => setNombre(e.target.value)} maxLength={LARGO.nombre} autoComplete="name"
              className={claseInput(errores.nombre)} {...ariaCampo(id('nombre'), errores.nombre)} />
          </Campo>
          <Campo id={id('contacto')} etiqueta="Correo o celular" obligatorio error={errores.contacto} ayuda="Para avisarte la respuesta.">
            <input id={id('contacto')} value={contacto} onChange={e => setContacto(e.target.value)} maxLength={LARGO.correo} autoComplete="email"
              inputMode="email" className={claseInput(errores.contacto)} {...ariaCampo(id('contacto'), errores.contacto, true)} />
          </Campo>
        </div>
      )}
      <AvisoError>{errorServidor}</AvisoError>
      <button type="submit" disabled={enviando}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-grafito px-4 py-2.5 text-sm font-bold text-papel hover:opacity-90 disabled:opacity-50">
        {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Enviar consulta
      </button>
    </form>
  );
}
