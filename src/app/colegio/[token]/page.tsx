'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, School, Upload } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import SearchSelect from '@/components/SearchSelect';
import { colegioEnlaceApi } from '@/services/api';
import { mensajeError } from '@/lib/api-base';
import { anexarAntiSpam, useAntiSpam } from '@/lib/antispam';
import { useAjustes } from '@/lib/ajustes';
import { AvisoError, CampoTrampa, ErrorCampo } from '@/components/form/Campo';
import NoEncontrado from '@/components/NoEncontrado';

interface Colegio { nombre: string; anio: number; grados: string[]; enviados: string[] }

/**
 * Página del colegio (/colegio/{token}): sube la lista de cada grado sin crear cuenta.
 * El enlace le llega por WhatsApp o correo desde Admin > Pedir listas.
 */
export default function ColegioEnlacePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const ajustes = useAjustes();
  const anti = useAntiSpam('subir-lista');
  const [colegio, setColegio] = useState<Colegio | null>(null);
  const [noValido, setNoValido] = useState(false);
  const [grado, setGrado] = useState('');
  const [nombre, setNombre] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [claveUploader, setClaveUploader] = useState(0);
  const [errores, setErrores] = useState<{ grado?: string | null; archivos?: string | null }>({});
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const enviando = useRef(false);

  const cargar = useCallback(() => colegioEnlaceApi.get(token).then(setColegio).catch(() => setNoValido(true)), [token]);
  useEffect(() => { cargar(); }, [cargar]);

  if (noValido) return (
    <NoEncontrado titulo="Este enlace no es válido" texto="Puede que esté incompleto. Escríbenos por WhatsApp y te enviamos uno nuevo."
      principal={{ href: `https://wa.me/${ajustes.whatsapp}`, texto: 'Escribir por WhatsApp' }} secundarias={[{ href: '/', texto: 'Ir a la tienda' }]} />
  );
  if (!colegio) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" /></div>;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando.current) return;
    const errs = { grado: grado ? null : 'Elige el grado de la lista.', archivos: archivos.length ? null : 'Sube al menos una foto, PDF o Word de la lista.' };
    setErrores(errs);
    if (errs.grado || errs.archivos) return;
    const limite = anti.revisar();
    if (limite) { setError(limite); return; }
    enviando.current = true;
    setSubiendo(true);
    setError('');
    try {
      const fd = new FormData();
      archivos.forEach(f => fd.append('files', f));
      fd.append('grado', grado);
      if (nombre.trim()) fd.append('nombre', nombre.trim());
      anexarAntiSpam(fd, await anti.datos());
      await colegioEnlaceApi.subir(token, fd);
      anti.anotar();
      anti.reiniciar();
      setUltimo(grado);
      setGrado('');
      setArchivos([]);
      setClaveUploader(k => k + 1);
      await cargar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(mensajeError(err, 'No pudimos subir la lista. Inténtalo de nuevo.'));
    } finally {
      enviando.current = false;
      setSubiendo(false);
    }
  };

  const pendientes = colegio.grados.filter(g => !colegio.enviados.includes(g));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="flex items-center gap-2 text-sm font-semibold text-primario"><School className="h-4 w-4" aria-hidden="true" /> {colegio.nombre}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Envíanos la lista de útiles {colegio.anio}</h1>
      <p className="mt-2 text-tenue">
        Sube la lista de cada grado (foto, PDF o Word). Así las familias la encuentran lista para comprar, completa y a buen precio. No necesitas crear cuenta.
      </p>

      {ultimo && (
        <div role="status" className="mt-6 rounded-2xl border border-eco/40 bg-eco-claro px-4 py-3">
          <p className="flex items-center gap-2 font-bold text-grafito"><CheckCircle2 className="h-5 w-5 text-eco" aria-hidden="true" /> ¡Gracias! Recibimos la lista de {ultimo}.</p>
          <p className="text-sm text-grafito">{pendientes.length ? 'Si tienes la de otro grado, súbela abajo.' : 'Ya tenemos todos los grados. ¡Muchas gracias!'}</p>
        </div>
      )}

      {colegio.enviados.length > 0 && (
        <p className="mt-6 text-sm text-tenue">Ya tenemos: <b className="text-grafito">{colegio.enviados.join(', ')}</b>.</p>
      )}

      <form onSubmit={enviar} noValidate aria-busy={subiendo} className="relative mt-6 space-y-6 rounded-2xl border border-linea bg-papel p-5">
        <CampoTrampa {...anti.trampa} sufijo="colegio" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="campo-grado" className="mb-1 block text-sm font-semibold">Grado <span className="text-profe" aria-hidden="true">*</span></label>
            <SearchSelect id="campo-grado" value={grado} onChange={v => { setGrado(v); setErrores(x => ({ ...x, grado: null })); }} placeholder="Elige el grado"
              invalido={!!errores.grado} describedBy={errores.grado ? 'campo-grado-error' : undefined}
              options={colegio.grados.map(g => ({ value: g, label: colegio.enviados.includes(g) ? `${g} (ya la tenemos)` : g }))} />
            <ErrorCampo id="campo-grado" error={errores.grado} />
          </div>
          <div>
            <label htmlFor="campo-nombre" className="mb-1 block text-sm font-semibold">Tu nombre <span className="font-normal text-tenue">(opcional)</span></label>
            <input id="campo-nombre" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={60} autoComplete="name"
              placeholder="Ej.: Secretaría académica" className="w-full rounded-xl border border-linea-fuerte bg-papel px-3 py-2.5 text-base sm:text-sm focus:border-primario focus:outline-none focus-visible:ring-2 focus-visible:ring-primario/25" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Lista <span className="text-profe" aria-hidden="true">*</span></p>
          <ImageUploader key={claveUploader} id="subir-archivos" maxFiles={5} invalido={!!errores.archivos}
            onImagesSelected={f => { setArchivos(f); setError(''); if (f.length) setErrores(x => ({ ...x, archivos: null })); }}
            onValidationError={errs => setError(errs.join('. '))} />
          <ErrorCampo id="subir-archivos" error={errores.archivos} />
        </div>
        <AvisoError>{error}</AvisoError>
        <button type="submit" disabled={subiendo}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-acento py-3 font-bold text-grafito shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro disabled:opacity-50">
          {subiendo ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-grafito border-t-transparent" aria-hidden="true" /> Subiendo…</> : <><Upload className="h-5 w-5" aria-hidden="true" /> Enviar lista</>}
        </button>
      </form>

      <p className="mt-6 text-sm text-tenue">
        ¿Prefieres enviarla por WhatsApp? Escríbenos al <a href={`https://wa.me/${ajustes.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primario underline underline-offset-2">{ajustes.telefono}</a>.
      </p>
    </div>
  );
}
