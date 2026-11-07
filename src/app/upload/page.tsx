'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Lock } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import SearchSelect from '@/components/SearchSelect';
import { useAuth } from '@/lib/auth-context';
import { listsApi, schoolsApi, sectionsApi } from '@/services/api';
import { School, Section } from '@/lib/types';
import { mensajeError } from '@/lib/api-base';
import { anexarAntiSpam, useAntiSpam } from '@/lib/antispam';
import { AvisoError, CampoTrampa, ErrorCampo } from '@/components/form/Campo';
import { enfocar, primerError } from '@/lib/validar';

// Solo el año escolar en curso y el siguiente (las listas viejas no sirven para comprar)
const AÑO_ACTUAL = new Date().getFullYear();
const AÑOS = [AÑO_ACTUAL, AÑO_ACTUAL + 1];

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [schoolSections, setSchoolSections] = useState<Section[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGradeName, setSelectedGradeName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0));
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<{ colegio?: string | null; grado?: string | null; archivos?: string | null }>({});
  const enviando = useRef(false);
  const anti = useAntiSpam('subir-lista');

  useEffect(() => {
    schoolsApi.getAll().then(setSchools).catch(() => setError('No pudimos cargar los colegios. Recarga la página.'));
    sectionsApi.getAll().then(setAllSections).catch(() => {});
  }, []);

  const elegirColegio = (v: string) => {
    if (!v) { setSchoolSections([]); setSelectedGradeName(''); }
    setSelectedSchool(v);
  };

  useEffect(() => {
    if (!selectedSchool) return;
    schoolsApi.getSchoolSections(selectedSchool).then(setSchoolSections).catch(() => setSchoolSections([]));
  }, [selectedSchool]);

  const handleUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (enviando.current) return;
    const errs = {
      colegio: selectedSchool ? null : 'Elige el colegio.',
      grado: selectedGradeName ? null : 'Elige el grado.',
      archivos: files.length > 0 ? null : 'Sube al menos una foto, PDF o Word de la lista.',
    };
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) {
      setError('');
      enfocar(primero === 'archivos' ? 'subir-archivos' : `campo-${primero}`);
      return;
    }
    const limite = anti.revisar();
    if (limite) { setError(limite); return; }
    enviando.current = true;
    setUploading(true);
    setError('');
    try {
      const newGrade = await schoolsApi.createGrade(selectedSchool, selectedGradeName, year);
      const gradeId = typeof newGrade === 'string' ? newGrade : String(newGrade.id || newGrade);

      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('userId', user?.id || '');
      formData.append('schoolId', selectedSchool);
      formData.append('gradeId', gradeId);
      formData.append('year', year.toString());
      anexarAntiSpam(formData, await anti.datos());

      const result = await listsApi.upload(formData);
      anti.anotar();
      router.push(result?.id ? `/lists/${result.id}` : '/my-lists');
    } catch (err: unknown) {
      setError(mensajeError(err, 'No pudimos subir la lista. Inténtalo de nuevo.'));
      enviando.current = false;
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="papel-cuadriculado flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="sombra-hoja max-w-md rounded-2xl bg-papel p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-primario" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Inicia sesión para subir tu lista</h1>
          <p className="mt-2 text-tenue">Así guardamos tu lista y te avisamos cuando esté armada.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/login?redirect=/upload" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-acento text-grafito shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] hover:bg-acento-oscuro px-5 py-3 font-bold">Iniciar sesión</Link>
            <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-grafito px-5 py-3 font-bold text-grafito hover:bg-fondo">Crear cuenta</Link>
          </div>
        </div>
      </div>
    );
  }

  const gradeOptions = (schoolSections.length > 0 ? schoolSections : allSections)
    .map(s => ({ value: s.name, label: s.name, group: s.groupName }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-extrabold tracking-[-0.03em]">Sube tu lista de útiles</h1>
      <p className="mt-2 text-lg text-tenue">La leemos, nuestro equipo la revisa y te avisamos cuando puedas elegir tu opción.</p>

      <form onSubmit={handleUpload} noValidate aria-busy={uploading} className="relative mt-8 space-y-8">
        <CampoTrampa {...anti.trampa} />
        <section aria-labelledby="paso-colegio">
          <h2 id="paso-colegio" className="flex items-baseline gap-2 text-lg font-bold">
            <span className="font-mano text-3xl leading-none text-primario">1.</span> ¿De qué colegio y grado es?
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.6fr_1.2fr_0.7fr]">
            <div>
              <label htmlFor="campo-colegio" className="mb-1 block text-sm font-semibold">Colegio <span className="text-profe" aria-hidden="true">*</span></label>
              <SearchSelect id="campo-colegio" value={selectedSchool} onChange={v => { elegirColegio(v); setErrores(x => ({ ...x, colegio: null })); }} placeholder="Busca tu colegio…"
                invalido={!!errores.colegio} describedBy={errores.colegio ? 'campo-colegio-error' : undefined}
                options={schools.map(s => ({ value: s.id, label: s.name }))} />
              <ErrorCampo id="campo-colegio" error={errores.colegio} />
            </div>
            <div>
              <label htmlFor="campo-grado" className="mb-1 block text-sm font-semibold">Grado <span className="text-profe" aria-hidden="true">*</span></label>
              <SearchSelect id="campo-grado" value={selectedGradeName} onChange={v => { setSelectedGradeName(v); setErrores(x => ({ ...x, grado: null })); }} disabled={!selectedSchool}
                invalido={!!errores.grado} describedBy={errores.grado ? 'campo-grado-error' : undefined}
                placeholder={selectedSchool ? 'Elige el grado' : 'Primero el colegio'} options={gradeOptions} />
              <ErrorCampo id="campo-grado" error={errores.grado} />
            </div>
            <div>
              <label htmlFor="campo-año" className="mb-1 block text-sm font-semibold">Año escolar</label>
              <SearchSelect id="campo-año" value={String(year)} onChange={v => setYear(parseInt(v))}
                options={AÑOS.map(y => ({ value: String(y), label: String(y) }))} />
            </div>
          </div>
        </section>

        <section aria-labelledby="paso-foto">
          <h2 id="paso-foto" className="flex items-baseline gap-2 text-lg font-bold">
            <span className="font-mano text-3xl leading-none text-primario">2.</span> Sube la lista
          </h2>
          <p className="mb-3 mt-1 text-sm text-tenue">Que se vea toda la hoja, de frente y con buena luz.</p>
          <ImageUploader
            onImagesSelected={(f) => { setFiles(f); setError(''); if (f.length) setErrores(x => ({ ...x, archivos: null })); }}
            onValidationError={(errors) => setError(errors.join('. '))}
            maxFiles={5}
            id="subir-archivos"
            invalido={!!errores.archivos}
          />
          <ErrorCampo id="subir-archivos" error={errores.archivos} />
        </section>

        <AvisoError>{error}</AvisoError>

        <button type="submit" disabled={uploading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-acento py-4 text-base font-bold text-grafito shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-acento-oscuro disabled:cursor-not-allowed disabled:opacity-50">
          {uploading
            ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-grafito border-t-transparent" aria-hidden="true" /> Subiendo…</>
            : <><Camera className="h-5 w-5" aria-hidden="true" /> Leer mi lista</>}
        </button>
      </form>
    </div>
  );
}
