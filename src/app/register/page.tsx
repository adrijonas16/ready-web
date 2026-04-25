'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const getPasswordStrength = (pwd: string): number => {
    if (pwd.length === 0) return 0;
    if (pwd.length < 6) return 1;
    let strength = 1;
    if (pwd.length >= 8) strength = 2;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)) strength = 3;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Sin contenido', 'Muy corta', 'Aceptable', 'Fuerte'];
  const strengthColors = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-green-400'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        await login(email, password);
        router.push('/');
      } else {
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-green-200 rounded-full opacity-50 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-teal-200 rounded-full opacity-50 blur-3xl" />

      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/50">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎒</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Crear Cuenta
          </h1>
          <p className="text-gray-500 mt-2">¡Únete a Ready y haz tu lista escolar!</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => router.push('/login')}
            className="flex-1 py-3 text-center rounded-xl font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Iniciar Sesión
          </button>
          <button
            className="flex-1 py-3 text-center rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
          >
            Registrarse
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre completo
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all pl-12 bg-white text-gray-900 placeholder-gray-400"
                placeholder="Tu nombre completo"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">👤</span>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all pl-12 bg-white text-gray-900 placeholder-gray-400"
                placeholder="tu@correo.com"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">📧</span>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all pl-12 pr-12 bg-white text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔒</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strengthColors[passwordStrength].replace('bg-', 'text-')}`}>
                  Contraseña {strengthLabels[passwordStrength]}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all pl-12 pr-12 bg-white text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔒</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Creando cuenta...
              </>
            ) : (
              <>
                <span>Crear Cuenta</span>
                <span className="text-xl">✨</span>
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}