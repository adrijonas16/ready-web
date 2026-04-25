'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import { useAuth } from '@/lib/auth-context';
import { listsApi, schoolsApi } from '@/services/api';
import { School, Grade } from '@/lib/types';
import { ImageValidationResult } from '@/lib/utils';
import { ArrowRight, List, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedListId, setUploadedListId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      loadGrades(selectedSchool);
    }
  }, [selectedSchool]);

  const loadSchools = async () => {
    try {
      const data = await schoolsApi.getAll();
      setSchools(data);
    } catch (err) {
      console.error('Error loading schools:', err);
    }
  };

  const loadGrades = async (schoolId: string) => {
    try {
      const data = await schoolsApi.getGrades(schoolId);
      setGrades(data);
    } catch (err) {
      console.error('Error loading grades:', err);
    }
  };

  const handleImageSelected = (file: File, validation: ImageValidationResult) => {
    setImageFile(file);
    setError('');
  };

  const handleValidationError = (errors: string[]) => {
    setImageFile(null);
    setError(errors.join(', '));
  };

  const handleUpload = async () => {
    if (!imageFile || !selectedSchool || !selectedGrade) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!user) {
      setError('Debes iniciar sesión para subir una lista');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('userId', user.id);
      formData.append('schoolId', selectedSchool);
      formData.append('gradeId', selectedGrade);
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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inicia sesión para continuar</h2>
          <p className="text-gray-600 mb-6">Necesitas estar registrado para subir tu lista de útiles.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  if (uploadComplete && uploadedListId) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Lista subida exitosamente!</h2>
          <p className="text-gray-600 mb-6">
            Tu lista ha sido recibida y está siendo procesada. El proceso puede tomar entre 1 y 2 horas.
            Te notificaremos cuando esté lista.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push(`/my-lists`)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <List className="h-5 w-5" />
              Ver mis listas
            </button>
            <button
              onClick={() => {
                setUploadComplete(false);
                setImageFile(null);
                setSelectedSchool('');
                setSelectedGrade('');
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              Subir otra lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Subir Lista de Útiles</h1>
        <p className="text-gray-600">
          Sube una foto de la lista de tu hijo y nosotros procesaremos los productos automáticamente.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="space-y-8">
          {/* Step 1: Image Upload */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Sube la imagen de tu lista
            </h2>
            <ImageUploader
              onImageSelected={handleImageSelected}
              onValidationError={handleValidationError}
            />
          </div>

          {/* Step 2: School Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Selecciona el colegio
            </h2>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setSelectedGrade('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona un colegio</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Grade Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Selecciona el grado
            </h2>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              disabled={!selectedSchool}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Selecciona un grado</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Año lectivo
            </h2>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleUpload}
            disabled={!imageFile || !selectedSchool || !selectedGrade || uploading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              <>
                Subir Lista
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}