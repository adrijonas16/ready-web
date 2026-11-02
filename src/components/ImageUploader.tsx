'use client';

import { useState, useRef } from 'react';
import { Camera, X, FileText } from 'lucide-react';
import { validateImage, ImageValidationResult } from '@/lib/utils';
import { compressImage } from '@/lib/compress-image';

interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  onValidationError?: (errors: string[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({ onImagesSelected, onValidationError, maxFiles = 5 }: ImageUploaderProps) {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Elegir fotos o archivos de la lista"
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => previews.length < maxFiles && fileInputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && previews.length < maxFiles) { e.preventDefault(); fileInputRef.current?.click(); } }}
        className={`papel-cuadriculado relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors
          ${isDragging ? 'border-tinta bg-tinta-claro' : 'border-linea hover:border-tinta'}
          ${previews.length >= maxFiles ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
          }}
          className="hidden"
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lapiz shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]">
          {isValidating
            ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-grafito border-t-transparent" />
            : <Camera className="h-6 w-6 text-grafito" aria-hidden="true" />}
        </div>
        <p className="mt-4 text-lg font-bold text-grafito">
          {isValidating ? 'Preparando las fotos…' : previews.length > 0 ? 'Agregar otra hoja' : 'Toma o elige la foto de la lista'}
        </p>
        <p className="mt-1 text-sm text-tenue">
          Fotos, PDF o Word. Hasta {maxFiles} archivos si la lista tiene varias hojas ({previews.length}/{maxFiles}).
        </p>
      </div>

      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {previews.map((p, i) => (
            <li key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-linea bg-papel">
              {p.url ? (
                <img src={p.url} alt={`Hoja ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-2 text-center">
                  <FileText className="mb-1 h-7 w-7 text-tinta" aria-hidden="true" />
                  <p className="max-w-full truncate text-[11px] text-tenue">{p.file.name}</p>
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-grafito/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">Hoja {i + 1}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute right-1.5 top-1.5 rounded-full bg-papel p-1 text-profe shadow hover:bg-profe-claro"
                aria-label={`Quitar hoja ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
