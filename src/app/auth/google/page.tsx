'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  return <Suspense><GoogleCallbackContent /></Suspense>;
}

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (token && userId) {
      loginWithToken(token, userId);
      router.push('/');
    }
  }, [searchParams, loginWithToken, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-6">
            {error === 'google_auth_failed' && 'No se pudo completar la autenticación con Google.'}
            {error === 'no_email' && 'No se pudo obtener el email de tu cuenta Google.'}
            {error === 'registration_failed' && 'No se pudo registrar tu cuenta.'}
          </p>
          <a
            href="/login"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg"
          >
            Volver al login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conectando con Google...</h2>
        <p className="text-gray-600">Por favor espera un momento</p>
      </div>
    </div>
  );
}