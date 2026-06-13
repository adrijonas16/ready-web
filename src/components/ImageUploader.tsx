'use client';

import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, X, Image as ImageIcon } from 'lucide-react';
import { validateImage, ImageValidationResult } from '@/lib/utils';

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

  const addFiles = async (newFiles: File[]) => {
    setIsValidating(true);
    const validFiles: { file: File; url: string; validation: ImageValidationResult }[] = [...previews];
    const errors: string[] = [];

    for (const file of newFiles) {
      if (validFiles.length >= maxFiles) {
        errors.push(`Maximo ${maxFiles} imagenes`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: no es una imagen`);
        continue;
      }
      const result = await validateImage(file);
      if (result.isValid) {
        validFiles.push({ file, url: URL.createObjectURL(file), validation: result });
      } else {
        errors.push(`${file.name}: ${result.errors.join(', ')}`);
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
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => previews.length < maxFiles && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging ? 'border-blue-500 bg-blue-50/60 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}
          ${previews.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
          }}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="flex justify-center">
            {isValidating ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            ) : (
              <Upload className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-700">
            {isValidating ? 'Validando...' : 'Arrastra tus imagenes aqui'}
          </p>
          <p className="text-xs text-gray-500">
            o haz clic para seleccionar ({previews.length}/{maxFiles})
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
              <img src={p.url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1 left-1">
                <CheckCircle className="h-4 w-4 text-green-500 drop-shadow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
