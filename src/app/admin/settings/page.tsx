'use client';

import { useState, useEffect } from 'react';
import { Save, Truck, Phone, Clock, Globe2 } from 'lucide-react';
import { configuracionApi, type ConfiguracionTienda } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import { Cargando, Interruptor, Modal, campo, tarjeta, useAvisos } from '../_ui';
import { BASE } from '@/lib/peru';
import { ErrorCampo } from '@/components/form/Campo';
import { LARGO, ariaCampo, enfocar, primerError, validarEntero, validarPrecio, validarTexto } from '@/lib/validar';

interface Form {
  costoEnvio: string; envioGratisDesde: string; whatsapp: string; telefono: string; horarioEntrega: string; diasEntrega: string; zonas: string;
  costoEnvioProvincias: string; diasEntregaProvincias: string;
}
const texto = (n?: number | null) => (n === null || n === undefined ? '' : String(n));
const aForm = (c: ConfiguracionTienda): Form => ({
  costoEnvio: String(c.costoEnvio ?? 0), envioGratisDesde: texto(c.envioGratisDesde),
  whatsapp: c.whatsapp ?? '', telefono: c.telefono ?? '', horarioEntrega: c.horarioEntrega ?? '', diasEntrega: String(c.diasEntrega ?? 0), zonas: c.zonas ?? '',
  costoEnvioProvincias: texto(c.costoEnvioProvincias), diasEntregaProvincias: texto(c.diasEntregaProvincias),
});

export default function AdminSettingsPage() {
  const avisos = useAvisos();
  const [form, setForm] = useState<Form | null>(null);
  const [original, setOriginal] = useState<Form | null>(null);
  // Envío a todo el Perú: se activa aquí y rige al guardar
  const [nacional, setNacional] = useState(false);
  const [nacionalOriginal, setNacionalOriginal] = useState(false);
  const [confirmarNacional, setConfirmarNacional] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<keyof Form, string | null>>>({});

  useEffect(() => {
    configuracionApi.get().then(c => { const f = aForm(c); setForm(f); setOriginal(f); setNacional(!!c.coberturaNacional); setNacionalOriginal(!!c.coberturaNacional); })
      .catch(e => avisos.error(e, 'No pudimos cargar la configuración'));
  }, [avisos]);

  if (!form) return <Cargando />;
  const set = (k: keyof Form, v: string) => { setForm(f => f && ({ ...f, [k]: v })); setErrores(e => ({ ...e, [k]: null })); };
  const cambios = JSON.stringify(form) !== JSON.stringify(original) || nacional !== nacionalOriginal;
  const vacioONulo = (v: string) => (v.trim() === '' ? null : Number(v));

  const guardar = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (guardando) return;
    const costo = Number(form.costoEnvio), gratis = form.envioGratisDesde.trim() === '' ? null : Number(form.envioGratisDesde), dias = Number(form.diasEntrega);
    const wsp = form.whatsapp.replace(/\D/g, '');
    const errs: Partial<Record<keyof Form, string | null>> = {
      costoEnvio: validarPrecio(form.costoEnvio, { permitirCero: true, maximo: 500 }),
      envioGratisDesde: gratis === null ? null : validarPrecio(form.envioGratisDesde, { maximo: 10000 }),
      diasEntrega: validarEntero(form.diasEntrega, { campo: 'los días', min: 0, max: 60 }),
      costoEnvioProvincias: form.costoEnvioProvincias.trim() === '' ? null : validarPrecio(form.costoEnvioProvincias, { permitirCero: true, maximo: 500 }),
      diasEntregaProvincias: form.diasEntregaProvincias.trim() === '' ? null : validarEntero(form.diasEntregaProvincias, { campo: 'los días', min: 0, max: 60 }),
      zonas: validarTexto(form.zonas, { obligatorio: false, max: LARGO.texto }),
      whatsapp: !wsp ? 'Escribe el número de WhatsApp de la tienda.' : /^519\d{8}$/.test(wsp) ? null : 'Escribe 51 y el celular de 9 dígitos, por ejemplo 51959000111.',
      telefono: validarTexto(form.telefono, { campo: 'el teléfono', min: 6, max: 20 }),
      horarioEntrega: validarTexto(form.horarioEntrega, { campo: 'el horario', min: 5, max: 100 }),
    };
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) { enfocar(primero); return; }
    setGuardando(true);
    try {
      const guardado = await configuracionApi.save({
        costoEnvio: costo, envioGratisDesde: gratis, whatsapp: wsp, telefono: form.telefono.trim(),
        horarioEntrega: form.horarioEntrega.trim(), diasEntrega: dias, ...(form.zonas.trim() ? { zonas: form.zonas.trim() } : {}),
        coberturaNacional: nacional, costoEnvioProvincias: vacioONulo(form.costoEnvioProvincias), diasEntregaProvincias: vacioONulo(form.diasEntregaProvincias),
      });
      const f = aForm(guardado); setForm(f); setOriginal(f);
      setNacional(!!guardado.coberturaNacional); setNacionalOriginal(!!guardado.coberturaNacional);
      avisos.exito(guardado.coberturaNacional !== nacionalOriginal
        ? (guardado.coberturaNacional ? 'Listo: la tienda ya vende y envía a todo el Perú' : `Listo: la tienda vuelve a vender solo en ${BASE}`)
        : 'Configuración guardada');
    } catch (e) { avisos.error(e, 'No pudimos guardar la configuración'); }
    finally { setGuardando(false); }
  };

  const gratis = form.envioGratisDesde.trim() === '' ? null : Number(form.envioGratisDesde);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Configuración de la tienda</h1>
      <p className="text-xs text-neutral-400 mb-4">Lo que guardes aquí lo ven los clientes al comprar.</p>

      <form onSubmit={guardar} noValidate className="space-y-4" aria-busy={guardando}>
        <section aria-labelledby="t-cobertura" className={`${tarjeta} p-4 sm:p-5 ${nacional ? 'ring-2 ring-green-400' : ''}`}>
          <h2 id="t-cobertura" className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2"><Globe2 className="h-4 w-4 text-blue-500" aria-hidden="true" /> Dónde vendemos</h2>
          <p className="text-xs text-slate-500 mb-3">
            {nacional
              ? 'Todo el Perú: la tienda muestra los colegios de todos los departamentos y acepta entregas en cualquier departamento.'
              : `Solo ${BASE}: la tienda muestra solo colegios de ${BASE} y no acepta entregas en otros departamentos. Puedes cargar y contactar colegios de otros departamentos desde ya; los clientes los verán cuando actives el envío nacional.`}
          </p>
          <Interruptor activo={nacional} etiqueta="Envíos a todo el Perú"
            onChange={v => { if (v) setConfirmarNacional(true); else setNacional(false); }} />
          {nacional !== nacionalOriginal && <p className="text-[11px] text-amber-700 mt-2" role="status">Se aplica al guardar la configuración.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Campo id="costoEnvioProvincias" label="Envío a otros departamentos (S/)" ayuda="Vacío = el mismo costo que en Arequipa." error={errores.costoEnvioProvincias}><input id="costoEnvioProvincias" {...ariaCampo('costoEnvioProvincias', errores.costoEnvioProvincias, true)} type="number" inputMode="decimal" min={0} max={500} step="0.5" value={form.costoEnvioProvincias} onChange={e => set('costoEnvioProvincias', e.target.value)} className={campo} /></Campo>
            <Campo id="diasEntregaProvincias" label="Días para entregar en otros departamentos" ayuda="Vacío = los mismos que en Arequipa." error={errores.diasEntregaProvincias}><input id="diasEntregaProvincias" {...ariaCampo('diasEntregaProvincias', errores.diasEntregaProvincias, true)} type="number" inputMode="numeric" min={0} max={60} step={1} value={form.diasEntregaProvincias} onChange={e => set('diasEntregaProvincias', e.target.value)} className={campo} /></Campo>
          </div>
        </section>

        <section aria-labelledby="t-envio" className={`${tarjeta} p-4 sm:p-5`}>
          <h2 id="t-envio" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-blue-500" aria-hidden="true" /> Envío</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo id="costoEnvio" label={`Costo de envío en ${BASE} (S/)`} error={errores.costoEnvio}><input id="costoEnvio" {...ariaCampo('costoEnvio', errores.costoEnvio)} type="number" inputMode="decimal" required min={0} max={500} step="0.5" value={form.costoEnvio} onChange={e => set('costoEnvio', e.target.value)} className={campo} /></Campo>
            <Campo id="envioGratisDesde" label="Envío gratis desde (S/)" ayuda="Déjalo vacío si nunca es gratis." error={errores.envioGratisDesde}><input id="envioGratisDesde" {...ariaCampo('envioGratisDesde', errores.envioGratisDesde, true)} type="number" inputMode="decimal" min={0} step="1" value={form.envioGratisDesde} onChange={e => set('envioGratisDesde', e.target.value)} className={campo} /></Campo>
            <Campo id="diasEntrega" label="Días para entregar" ayuda="Días hábiles desde el pedido." error={errores.diasEntrega}><input id="diasEntrega" {...ariaCampo('diasEntrega', errores.diasEntrega, true)} type="number" inputMode="numeric" required min={0} max={60} step={1} value={form.diasEntrega} onChange={e => set('diasEntrega', e.target.value)} className={campo} /></Campo>
          </div>
          <p className="text-[11px] text-slate-500 mt-3" data-resumen-envio>
            El cliente paga {formatPrice(Number(form.costoEnvio) || 0)} de envío{gratis !== null && Number.isFinite(gratis) ? `, gratis en compras desde ${formatPrice(gratis)}` : ''}.
          </p>
          <div className="mt-3">
            <Campo id="zonas" label="Zonas de reparto (opcional)" error={errores.zonas}><textarea id="zonas" {...ariaCampo('zonas', errores.zonas)} maxLength={LARGO.texto} rows={2} value={form.zonas} onChange={e => set('zonas', e.target.value)} placeholder="Ej: Cercado, Yanahuara, Cayma…" className={campo} /></Campo>
          </div>
        </section>

        <section aria-labelledby="t-contacto" className={`${tarjeta} p-4 sm:p-5`}>
          <h2 id="t-contacto" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Phone className="h-4 w-4 text-blue-500" aria-hidden="true" /> Contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo id="whatsapp" label="WhatsApp" ayuda="Con código de país, solo números: 51951237582" error={errores.whatsapp}><input id="whatsapp" {...ariaCampo('whatsapp', errores.whatsapp, true)} type="tel" inputMode="numeric" autoComplete="off" required maxLength={LARGO.celular} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={campo} /></Campo>
            <Campo id="telefono" label="Teléfono (como se muestra)" error={errores.telefono}><input id="telefono" {...ariaCampo('telefono', errores.telefono)} type="tel" inputMode="tel" autoComplete="off" required maxLength={20} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="959 000 111" className={campo} /></Campo>
          </div>
        </section>

        <section aria-labelledby="t-horario" className={`${tarjeta} p-4 sm:p-5`}>
          <h2 id="t-horario" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" aria-hidden="true" /> Horario de entrega</h2>
          <Campo id="horarioEntrega" label="Horario" error={errores.horarioEntrega}><input id="horarioEntrega" {...ariaCampo('horarioEntrega', errores.horarioEntrega)} required maxLength={100} value={form.horarioEntrega} onChange={e => set('horarioEntrega', e.target.value)} placeholder="Lunes a sábado, 9:00 a 18:00" className={campo} /></Campo>
        </section>

        <div className="flex items-center justify-end gap-3">
          {cambios && <span className="text-xs text-grafito font-semibold" role="status">Hay cambios sin guardar</span>}
          <button type="submit" disabled={guardando || !cambios}
            className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow disabled:opacity-40">
            <Save className="h-4 w-4" aria-hidden="true" /> {guardando ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </form>

      {confirmarNacional && (
        <Modal titulo="¿Vender en todo el Perú?" onClose={() => setConfirmarNacional(false)}>
          <div className="space-y-3 text-sm text-slate-700">
            <p>Al guardar, los clientes verán los colegios de todos los departamentos y podrán pedir con entrega en cualquier parte del Perú.</p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>Revisa el costo y los días de envío a otros departamentos (abajo del interruptor).</li>
              <li>Puedes volver a solo {BASE} cuando quieras; los pedidos ya hechos no cambian.</li>
            </ul>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setConfirmarNacional(false)} className="min-h-10 px-3 text-xs text-tenue">Cancelar</button>
              <button type="button" autoFocus onClick={() => { setNacional(true); setConfirmarNacional(false); }}
                className="min-h-10 rounded-lg bg-green-600 px-4 text-xs font-bold text-white">Sí, activar todo el Perú</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Campo({ id, label, ayuda, error, children }: { id: string; label: string; ayuda?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-700 mb-1">{label}</label>
      {children}
      {error ? <ErrorCampo id={id} error={error} /> : ayuda && <p id={`${id}-ayuda`} className="text-[11px] text-tenue mt-1">{ayuda}</p>}
    </div>
  );
}
