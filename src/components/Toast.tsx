'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-sm ${
        type === 'success'
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25'
          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/25'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="h-6 w-6 animate-check-pop" />
        ) : (
          <XCircle className="h-6 w-6" />
        )}
        <p className="font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-xl transition-colors duration-200 ml-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
