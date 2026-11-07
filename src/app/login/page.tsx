'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, LogIn, Loader2, UserRound, ShieldCheck } from 'lucide-react';
import { MODO_DEMO, mensajeError } from '@/lib/api-base';
import { AvisoError, ErrorCampo } from '@/components/form/Campo';
import { LARGO, ariaCampo, enfocar, primerError, validarCorreoCuenta } from '@/lib/validar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ email?: string | null; password?: string | null }>({});
  const enviando = useRef(false);
  const { login } = useAuth();
  const router = useRouter();

  // Vuelve a la página desde la que se pidió iniciar sesión (?redirect=/checkout)
  const destino = () => {
    const r = new URLSearchParams(window.location.search).get('redirect');
    return r && r.startsWith('/') && !r.startsWith('//') ? r : '/';
  };

  const entrar = async (correo: string, clave: string) => {
    if (enviando.current) return; // sin doble envío
    enviando.current = true;
    setError('');
    setLoading(true);
    try {
      await login(correo.trim(), clave);
      router.push(correo.startsWith('admin') && destino() === '/' ? '/admin' : destino());
    } catch (err: unknown) {
      setError(mensajeError(err, 'Correo o contraseña incorrectos.'));
      enviando.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { email: validarCorreoCuenta(email), password: password ? null : 'Escribe tu contraseña.' };
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) { enfocar(primero); return; }
    entrar(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
      <div className="max-w-md w-full animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido de vuelta</h1>
          <p className="text-neutral-400 text-sm">Ingresa a tu cuenta para continuar</p>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)]">
          <div className="flex gap-2 mb-6">
            <Link href="/login" className="flex-1 py-2.5 text-center rounded-xl font-medium text-sm bg-blue-500 text-white shadow-md shadow-blue-500/20">
              Iniciar sesión
            </Link>
            <Link href="/register" className="flex-1 py-2.5 text-center rounded-xl font-medium text-sm bg-white text-blue-500 border border-slate-200 hover:bg-slate-50 transition-colors duration-150">
              Registrarse
            </Link>
          </div>

          {MODO_DEMO ? (
            <div className="mb-6 rounded-xl border border-acento bg-acento-claro p-4">
              <p className="text-sm font-bold text-slate-900">Tienda de demostración</p>
              <p className="mt-1 text-xs text-slate-700">Entra con cualquier correo y contraseña, o usa una cuenta de prueba:</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button type="button" disabled={loading} onClick={() => entrar('cliente@demo.pe', 'demo')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                  <UserRound className="h-4 w-4" aria-hidden="true" /> Soy cliente
                </button>
                <button type="button" disabled={loading} onClick={() => entrar('admin@ready.pe', 'demo')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Soy administrador
                </button>
              </div>
            </div>
          ) : null}

          {MODO_DEMO && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-tenue">o con tu correo</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={loading}>
            <AvisoError>{error}</AvisoError>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
              <input
                type="email" id="email" name="email" autoComplete="email" inputMode="email" maxLength={LARGO.correo} value={email}
                onChange={(e) => { setEmail(e.target.value); if (errores.email) setErrores(x => ({ ...x, email: null })); }} required {...ariaCampo('email', errores.email)}
                className={`w-full px-4 py-3 bg-white border ${errores.email ? 'border-profe' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color] duration-150 text-sm placeholder-neutral-400`}
                placeholder="tu@correo.com"
              />
              <ErrorCampo id="email" error={errores.email} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="current-password" maxLength={LARGO.clave} value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errores.password) setErrores(x => ({ ...x, password: null })); }} required {...ariaCampo('password', errores.password)}
                  className={`w-full px-4 py-3 bg-white border ${errores.password ? 'border-profe' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color] duration-150 pr-11 text-sm placeholder-neutral-400`}
                  placeholder="Tu contraseña"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-slate-600 p-1 rounded transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <ErrorCampo id="password" error={errores.password} />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-bold text-sm transition-[opacity,box-shadow] duration-150 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Entrando…</> : <><LogIn className="h-4 w-4" aria-hidden="true" />Iniciar sesión</>}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-semibold text-blue-500 hover:text-blue-600 transition-colors">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
