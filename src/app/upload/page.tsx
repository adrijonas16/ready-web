'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Lock } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import SearchSelect from '@/components/SearchSelect';
import { useAuth } from '@/lib/auth-context';
import { listsApi, schoolsApi, sectionsApi } from '@/services/api';
import { School, Section } from '@/lib/types';

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

  const listo = files.length > 0 && !!selectedSchool && !!selectedGradeName;

  const handleUpload = async () => {
    if (!listo) {
      setError('Elige el colegio, el grado y sube al menos una foto de la lista.');
      return;
    }
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

      const result = await listsApi.upload(formData);
      router.push(result?.id ? `/lists/${result.id}` : '/my-lists');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No pudimos subir la lista. Inténtalo de nuevo.');
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
            <Link href="/login" className="rounded-xl bg-primario px-5 py-3 font-bold text-white hover:bg-primario-oscuro">Iniciar sesión</Link>
            <Link href="/register" className="rounded-xl border-2 border-grafito px-5 py-3 font-bold text-grafito hover:bg-fondo">Crear cuenta</Link>
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

      <div className="mt-8 space-y-8">
        <section aria-labelledby="paso-colegio">
          <h2 id="paso-colegio" className="flex items-baseline gap-2 text-lg font-bold">
            <span className="font-mano text-3xl leading-none text-primario">1.</span> ¿De qué colegio y grado es?
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.6fr_1.2fr_0.7fr]">
            <div>
              <label className="mb-1 block text-sm font-medium text-tenue">Colegio</label>
              <SearchSelect value={selectedSchool} onChange={elegirColegio} placeholder="Busca tu colegio…"
                options={schools.map(s => ({ value: s.id, label: s.name }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-tenue">Grado</label>
              <SearchSelect value={selectedGradeName} onChange={setSelectedGradeName} disabled={!selectedSchool}
                placeholder={selectedSchool ? 'Elige el grado' : 'Primero el colegio'} options={gradeOptions} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-tenue">Año escolar</label>
              <SearchSelect value={String(year)} onChange={v => setYear(parseInt(v))}
                options={[2025, 2026, 2027].map(y => ({ value: String(y), label: String(y) }))} />
            </div>
          </div>
        </section>

        <section aria-labelledby="paso-foto">
          <h2 id="paso-foto" className="flex items-baseline gap-2 text-lg font-bold">
            <span className="font-mano text-3xl leading-none text-primario">2.</span> Sube la lista
          </h2>
          <p className="mb-3 mt-1 text-sm text-tenue">Que se vea toda la hoja, de frente y con buena luz.</p>
          <ImageUploader
            onImagesSelected={(f) => { setFiles(f); setError(''); }}
            onValidationError={(errors) => setError(errors.join('. '))}
            maxFiles={5}
          />
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-profe/30 bg-profe-claro px-4 py-3 text-sm text-profe">{error}</p>
        )}

        <button onClick={handleUpload} disabled={!listo || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primario py-4 text-base font-bold text-white transition-colors hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-40">
          {uploading
            ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Subiendo…</>
            : <><Camera className="h-5 w-5" aria-hidden="true" /> Leer mi lista</>}
        </button>
      </div>
    </div>
  );
}
