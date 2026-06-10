'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle, X } from 'lucide-react';
import { validateImage, ImageValidationResult } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelected: (file: File, validation: ImageValidationResult) => void;
  onValidationError?: (errors: string[]) => void;
}

export default function ImageUploader({ onImageSelected, onValidationError }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [validation, setValidation] = useState<ImageValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidation({
        isValid: false,
        errors: ['El archivo debe ser una imagen'],
        width: 0,
        height: 0,
        brightness: 0,
        blurScore: 0,
      });
      return;
    }

    setIsValidating(true);
    const result = await validateImage(file);
    setValidation(result);
    setIsValidating(false);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (result.isValid) {
      onImageSelected(file, result);
    } else {
      onValidationError?.(result.errors);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearImage = () => {
    setPreview(null);
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !preview && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
          ${isDragging ? 'border-blue-500 bg-blue-50/60 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}
          ${preview ? 'cursor-default' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-96 mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isValidating ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isValidating ? 'Validando imagen...' : 'Arrastra tu imagen aquí'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                o haz clic para seleccionar
              </p>
            </div>
          </div>
        )}
      </div>

      {validation && (
        <div className={`rounded-lg p-4 ${validation.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start gap-3">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                {validation.isValid ? 'Imagen válida' : 'Problemas detectados'}
              </h4>
              <ul className={`mt-2 text-sm ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  {validation.width} x {validation.height} px
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </li>
              </ul>
              {!validation.isValid && (
                <div className="mt-3">
                  <p className="font-medium text-red-800 mb-1">Errores:</p>
                  <ul className="list-disc list-inside text-red-700">
                    {validation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}