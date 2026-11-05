'use client';

import { useState, useEffect } from 'react';
import { Save, Truck, Phone, Clock } from 'lucide-react';
import { configuracionApi, type ConfiguracionTienda } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import { Cargando, campo, tarjeta, useAvisos } from '../_ui';

interface Form { costoEnvio: string; envioGratisDesde: string; whatsapp: string; telefono: string; horarioEntrega: string; diasEntrega: string; zonas: string }
const aForm = (c: ConfiguracionTienda): Form => ({
  costoEnvio: String(c.costoEnvio ?? 0), envioGratisDesde: c.envioGratisDesde === null || c.envioGratisDesde === undefined ? '' : String(c.envioGratisDesde),
  whatsapp: c.whatsapp ?? '', telefono: c.telefono ?? '', horarioEntrega: c.horarioEntrega ?? '', diasEntrega: String(c.diasEntrega ?? 0), zonas: c.zonas ?? '',
});

export default function AdminSettingsPage() {
  const avisos = useAvisos();
  const [form, setForm] = useState<Form | null>(null);
  const [original, setOriginal] = useState<Form | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    configuracionApi.get().then(c => { const f = aForm(c); setForm(f); setOriginal(f); })
      .catch(e => avisos.error(e, 'No pudimos cargar la configuración'));
  }, [avisos]);

  if (!form) return <Cargando />;
  const set = (k: keyof Form, v: string) => setForm(f => f && ({ ...f, [k]: v }));
  const cambios = JSON.stringify(form) !== JSON.stringify(original);

  const guardar = async () => {
    const costo = Number(form.costoEnvio), gratis = form.envioGratisDesde.trim() === '' ? null : Number(form.envioGratisDesde), dias = Number(form.diasEntrega);
    if (!Number.isFinite(costo) || costo < 0) { avisos.error(null, 'El costo de envío no es válido'); return; }
    if (gratis !== null && (!Number.isFinite(gratis) || gratis < 0)) { avisos.error(null, 'El monto para envío gratis no es válido'); return; }
    if (!Number.isInteger(dias) || dias < 0) { avisos.error(null, 'Los días de entrega deben ser un número entero'); return; }
    const wsp = form.whatsapp.replace(/\D/g, '');
    if (wsp && wsp.length < 9) { avisos.error(null, 'El WhatsApp debe tener al menos 9 dígitos (con 51 adelante)'); return; }
    setGuardando(true);
    try {
      const guardado = await configuracionApi.save({
        costoEnvio: costo, envioGratisDesde: gratis, whatsapp: wsp, telefono: form.telefono.trim(),
        horarioEntrega: form.horarioEntrega.trim(), diasEntrega: dias, ...(form.zonas.trim() ? { zonas: form.zonas.trim() } : {}),
      });
      const f = aForm(guardado); setForm(f); setOriginal(f);
      avisos.exito('Configuración guardada');
    } catch (e) { avisos.error(e, 'No pudimos guardar la configuración'); }
    finally { setGuardando(false); }
  };

  const gratis = form.envioGratisDesde.trim() === '' ? null : Number(form.envioGratisDesde);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Configuración de la tienda</h1>
      <p className="text-xs text-neutral-400 mb-4">Lo que guardes aquí lo ven los clientes al comprar.</p>

      <div className="space-y-4">
        <section aria-labelledby="t-envio" className={`${tarjeta} p-4 sm:p-5`}>
          <h2 id="t-envio" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-blue-500" aria-hidden="true" /> Envío</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo id="costoEnvio" label="Costo de envío (S/)"><input id="costoEnvio" type="number" min={0} step="0.5" value={form.costoEnvio} onChange={e => set('costoEnvio', e.target.value)} className={campo} /></Campo>
            <Campo id="envioGratisDesde" label="Envío gratis desde (S/)" ayuda="Déjalo vacío si nunca es gratis."><input id="envioGratisDesde" type="number" min={0} step="1" value={form.envioGratisDesde} onChange={e => set('envioGratisDesde', e.target.value)} className={campo} /></Campo>
            <Campo id="diasEntrega" label="Días para entregar" ayuda="Días hábiles desde el pedido."><input id="diasEntrega" type="number" min={0} max={60} value={form.diasEntrega} onChange={e => set('diasEntrega', e.target.value)} className={campo} /></Campo>
          </div>
          <p className="text-[11px] text-slate-500 mt-3" data-resumen-envio>
            El cliente paga {formatPrice(Number(form.costoEnvio) || 0)} de envío{gratis !== null && Number.isFinite(gratis) ? `, gratis en compras desde ${formatPrice(gratis)}` : ''}.
          </p>
          <div className="mt-3">
            <Campo id="zonas" label="Zonas de reparto (opcional)"><textarea id="zonas" rows={2} value={form.zonas} onChange={e => set('zonas', e.target.value)} placeholder="Ej: Cercado, Yanahuara, Cayma…" className={campo} /></Campo>
          </div>
        </section>

        <section aria-labelledby="t-contacto" className={`${tarjeta} p-4 sm:p-5`}>
          <h2 id="t-contacto" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Phone className="h-4 w-4 text-blue-500" aria-hidden="true" /> Contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo id="whatsapp" label="WhatsApp" ayuda="Con código de país, solo números: 51959000111"><input id="whatsapp" inputMode="numeric" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={campo} /></Campo>
            <Campo id="telefono" label="Teléfono (como se muestra)"><input id="telefono" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="959 000 111" className={campo} /></Campo>
          </div>
        </section>

        <section aria-labelledby="t-horario" className={`${tarjeta} p-4 sm:p-5`}>
          <h2 id="t-horario" className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" aria-hidden="true" /> Horario de entrega</h2>
          <Campo id="horarioEntrega" label="Horario"><input id="horarioEntrega" value={form.horarioEntrega} onChange={e => set('horarioEntrega', e.target.value)} placeholder="Lunes a sábado, 9:00 a 18:00" className={campo} /></Campo>
        </section>

        <div className="flex items-center justify-end gap-3">
          {cambios && <span className="text-xs text-orange-500 font-medium">Hay cambios sin guardar</span>}
          <button onClick={guardar} disabled={guardando || !cambios}
            className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow disabled:opacity-40">
            <Save className="h-4 w-4" aria-hidden="true" /> {guardando ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ id, label, ayuda, children }: { id: string; label: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-700 mb-1">{label}</label>
      {children}
      {ayuda && <p className="text-[10px] text-neutral-400 mt-1">{ayuda}</p>}
    </div>
  );
}
