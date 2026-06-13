'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import { useAuth } from '@/lib/auth-context';
import { listsApi, schoolsApi, sectionsApi } from '@/services/api';
import { School, Section } from '@/lib/types';
import { groupSections } from '@/lib/constants';
import { CheckCircle, List, Upload } from 'lucide-react';
import SearchSelect from '@/components/SearchSelect';
import Link from 'next/link';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [schoolSections, setSchoolSections] = useState<Section[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGradeName, setSelectedGradeName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedListId, setUploadedListId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadSchools(); loadAllSections(); }, []);

  useEffect(() => {
    if (selectedSchool) { loadSchoolSections(selectedSchool); }
    else { setSchoolSections([]); setSelectedGradeName(''); }
  }, [selectedSchool]);

  const loadSchools = async () => {
    try { const data = await schoolsApi.getAll(); setSchools(data); }
    catch (err) { console.error('Error loading schools:', err); }
  };

  const loadAllSections = async () => {
    try { const data = await sectionsApi.getAll(); setAllSections(data); }
    catch (err) { console.error('Error loading sections:', err); }
  };

  const loadSchoolSections = async (schoolId: string) => {
    try {
      const data = await schoolsApi.getSchoolSections(schoolId);
      setSchoolSections(data);
    } catch (err) { console.error('Error loading school sections:', err); }
  };

  const handleUpload = async () => {
    if (imageFiles.length === 0 || !selectedSchool || !selectedGradeName) {
      setError('Completa todos los campos y sube al menos una imagen');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const newGrade = await schoolsApi.createGrade(selectedSchool, selectedGradeName, year);
      const gradeId = typeof newGrade === 'string' ? newGrade : newGrade.id || newGrade;

      const formData = new FormData();
      imageFiles.forEach(f => formData.append('files', f));
      formData.append('userId', user?.id || '');
      formData.append('schoolId', selectedSchool);
      formData.append('gradeId', gradeId);
      formData.append('year', year.toString());

      const result = await listsApi.upload(formData);
      setUploadedListId(result.id);
      setUploadComplete(true);
    } catch (err: any) {
      setError(err.message || 'Error al subir la lista');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="text-center">
          <Upload className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Inicia sesion para subir tu lista</h2>
          <p className="text-neutral-400 text-sm mb-6">Necesitas estar registrado para subir listas.</p>
          <Link href="/login" className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            Iniciar Sesion
          </Link>
        </div>
      </div>
    );
  }

  if (uploadComplete && uploadedListId) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lista subida</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Tu lista esta siendo procesada. Te notificaremos cuando este lista.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/my-lists')}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
              <List className="h-4 w-4" /> Ver mis listas
            </button>
            <button onClick={() => { setUploadComplete(false); setImageFiles([]); setSelectedSchool(''); setSelectedGradeName(''); }}
              className="w-full bg-white text-slate-700 py-3 rounded-xl font-medium text-sm shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow">
              Subir otra lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100">
      <div className="max-w-3xl mx-auto py-6 px-4">
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight mb-1">Enviar Lista de Utiles</h1>
        <p className="text-neutral-400 text-sm mb-6">Sube fotos, PDF o Word de tu lista (hasta 5 archivos). La revisaremos y te notificaremos.</p>

        <div className="bg-white rounded-[20px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-5 space-y-5 animate-slide-up">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Colegio</label>
              <SearchSelect
                value={selectedSchool}
                onChange={setSelectedSchool}
                placeholder="Seleccionar colegio"
                options={schools.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Grado</label>
              <SearchSelect
                value={selectedGradeName}
                onChange={setSelectedGradeName}
                disabled={!selectedSchool}
                placeholder={!selectedSchool ? 'Primero selecciona colegio' : 'Seleccionar grado'}
                options={(schoolSections.length > 0 ? schoolSections : allSections).map(s => ({ value: s.name, label: s.name, group: s.groupName }))}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Ano</label>
              <SearchSelect
                value={String(year)}
                onChange={v => setYear(parseInt(v))}
                options={[2024, 2025, 2026, 2027].map(y => ({ value: String(y), label: String(y) }))}
              />
            </div>
          </div>

          <ImageUploader
            onImagesSelected={(files) => { setImageFiles(files); setError(''); }}
            onValidationError={(errors) => setError(errors.join(', '))}
            maxFiles={5}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <button onClick={handleUpload}
            disabled={imageFiles.length === 0 || !selectedSchool || !selectedGradeName || uploading}
            className="w-full bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-shadow">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Upload className="h-4 w-4" /> Subir Lista ({imageFiles.length} foto{imageFiles.length !== 1 ? 's' : ''})</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
