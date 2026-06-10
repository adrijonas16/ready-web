'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
  const strengthLabels = ['', 'Muy corta', 'Aceptable', 'Fuerte'];
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthTextColors = ['text-slate-400', 'text-red-500', 'text-yellow-600', 'text-green-600'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Las contrasenas no coinciden'); return; }
    if (password.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) { await login(email, password); router.push('/'); }
      else { setError(data.error?.message || 'Error al registrar'); }
    } catch { setError('Error de conexion'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Crear Cuenta</h1>
          <p className="text-neutral-400 text-sm">Unete a Ready y haz tu lista escolar</p>
        </div>

        <div className="bg-white p-8 rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)]">
          <div className="flex gap-2 mb-6">
            <Link href="/login" className="flex-1 py-2.5 text-center rounded-xl font-medium text-sm bg-white text-blue-500 border border-slate-200 hover:bg-slate-50 transition-colors">
              Iniciar Sesion
            </Link>
            <button className="flex-1 py-2.5 text-center rounded-xl font-medium text-sm bg-blue-500 text-white shadow-md shadow-blue-500/20">
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl animate-slide-up text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color] duration-150 text-sm placeholder-neutral-400"
                placeholder="Tu nombre" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Correo electronico</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color] duration-150 text-sm placeholder-neutral-400"
                placeholder="tu@correo.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Contrasena</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color] duration-150 pr-11 text-sm placeholder-neutral-400"
                  placeholder="Minimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-slate-600 p-1 rounded">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthTextColors[passwordStrength]}`}>{strengthLabels[passwordStrength]}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contrasena</label>
              <input type={showPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-[box-shadow,border-color] duration-150 text-sm placeholder-neutral-400 ${
                  confirmPassword && confirmPassword !== password ? 'border-red-300' : confirmPassword && confirmPassword === password ? 'border-green-300' : 'border-slate-200'
                }`}
                placeholder="Repite tu contrasena" />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl transition-[opacity,box-shadow] duration-150 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:shadow-lg hover:shadow-blue-500/25">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creando cuenta...</> : 'Crear Cuenta'}
            </button>

            <p className="text-center text-sm text-neutral-400">
              Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-500 hover:text-blue-600 font-semibold transition-colors">Inicia sesion</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
