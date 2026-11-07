'use client';

import { useState, useRef } from 'react';
import { Camera, X, FileText, Sparkles } from 'lucide-react';
import { FotoLista } from '@/components/home/Ilustraciones';
import { MODO_DEMO } from '@/lib/api-base';
import { validateImage, ImageValidationResult } from '@/lib/utils';
import { compressImage } from '@/lib/compress-image';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  onValidationError?: (errors: string[]) => void;
  maxFiles?: number;
  /** id de la zona para soltar (enfocable), para llevar el foco cuando falta el archivo */
  id?: string;
  invalido?: boolean;
}

export default function ImageUploader({ onImagesSelected, onValidationError, maxFiles = 5, id, invalido }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string; validation: ImageValidationResult }[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const addFiles = async (newFiles: File[]) => {
    setIsValidating(true);
    const validFiles: { file: File; url: string; validation: ImageValidationResult }[] = [...previews];
    const errors: string[] = [];

    for (const original of newFiles) {
      const file = await compressImage(original);
      if (validFiles.length >= maxFiles) {
        errors.push(`Máximo ${maxFiles} archivos`);
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: solo fotos, PDF o Word`);
        continue;
      }
      if (file.type.startsWith('image/')) {
        const result = await validateImage(file);
        if (result.isValid) {
          validFiles.push({ file, url: URL.createObjectURL(file), validation: result });
        } else {
          errors.push(`${file.name}: ${result.errors.join(', ')}`);
        }
      } else {
        // PDF or Word - no image validation needed
        validFiles.push({ file, url: '', validation: { isValid: true, errors: [], width: 0, height: 0, brightness: 0, blurScore: 0 } });
      }
    }

    setPreviews(validFiles);
    onImagesSelected(validFiles.map(v => v.file));
    if (errors.length > 0) onValidationError?.(errors);
    setIsValidating(false);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onImagesSelected(updated.map(v => v.file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Demo: convierte la lista dibujada de ejemplo en una foto PNG para probar sin tener una a la mano
  const usarEjemplo = async () => {
    const { imagenListaEjemplo } = await import('@/demo/catalogo');
    const img = new Image();
    img.src = imagenListaEjemplo;
    await img.decode();
    const lienzo = document.createElement('canvas');
    lienzo.width = 900; lienzo.height = 1200;
    lienzo.getContext('2d')!.drawImage(img, 0, 0, 900, 1200);
    const blob = await new Promise<Blob | null>(r => lienzo.toBlob(r, 'image/png'));
    if (blob) addFiles([new File([blob], 'lista-de-ejemplo.png', { type: 'image/png' })]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4">
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-label="Elegir fotos o archivos de la lista"
        aria-invalid={invalido || undefined}
        aria-describedby={invalido && id ? `${id}-error` : undefined}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => previews.length < maxFiles && fileInputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && previews.length < maxFiles) { e.preventDefault(); fileInputRef.current?.click(); } }}
        className={`group papel-cuadriculado relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-[border-color,background-color,transform] duration-300
          ${isDragging ? 'scale-[1.02] border-primario bg-primario-claro' : invalido ? 'border-profe' : 'border-linea-fuerte hover:border-primario'}
          ${previews.length >= maxFiles ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
          }}
          className="hidden"
        />
        <div className="relative mx-auto h-28 w-40">
          <FotoLista className={`h-full w-full transition-transform duration-500 ${isDragging ? '-translate-y-2 scale-110' : 'group-hover:-translate-y-1'}`} />
          <span className="absolute -bottom-1 right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-acento shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)] transition-transform duration-300 group-hover:scale-110">
            {isValidating
              ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-grafito border-t-transparent" />
              : <Camera className="h-5 w-5 text-slate-900" aria-hidden="true" />}
          </span>
        </div>
        <p className="mt-4 text-lg font-bold text-grafito">
          {isValidating ? 'Preparando las fotos…' : isDragging ? '¡Suéltala aquí!' : previews.length > 0 ? 'Agregar otra hoja' : 'Toma o elige la foto de la lista'}
        </p>
        <p className="mt-1 text-sm text-tenue">
          Fotos, PDF o Word. Hasta {maxFiles} archivos si la lista tiene varias hojas ({previews.length}/{maxFiles}).
        </p>
      </div>

      {MODO_DEMO && previews.length === 0 && (
        <button type="button" onClick={usarEjemplo}
          className="mx-auto flex items-center gap-2 rounded-xl border border-dashed border-linea-fuerte px-4 py-2 text-sm font-semibold text-primario hover:border-primario hover:bg-primario-claro">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> ¿No tienes la lista a la mano? Usa una de ejemplo
        </button>
      )}

      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {previews.map((p, i) => (
            <li key={i} className="relative aspect-[3/4] animate-scale-in overflow-hidden rounded-xl border border-linea bg-papel" style={{ animationDelay: `${i * 60}ms` }}>
              {p.url ? (
                <>
                  <img src={p.url} alt={`Hoja ${i + 1} de la lista`} width={150} height={200} decoding="async" className="h-full w-full object-cover" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-acento/50 to-transparent animate-escaneo-hoja" />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-2 text-center">
                  <FileText className="mb-1 h-7 w-7 text-primario" aria-hidden="true" />
                  <p className="max-w-full truncate text-[11px] text-tenue">{p.file.name}</p>
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-grafito/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">Hoja {i + 1}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute right-0.5 top-0.5 flex h-9 w-9 items-center justify-center rounded-full text-profe hover:bg-profe-claro/60"
                aria-label={`Quitar hoja ${i + 1}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-papel shadow"><X className="h-3.5 w-3.5" aria-hidden="true" /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
