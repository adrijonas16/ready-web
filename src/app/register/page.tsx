'use client';

import AceptoTerminos from '@/components/AceptoTerminos';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/services/api';
import { mensajeError } from '@/lib/api-base';
import { useAntiSpam } from '@/lib/antispam';
import { AvisoError, CampoTrampa, ErrorCampo } from '@/components/form/Campo';
import {
  LARGO, ariaCampo, enfocar, fuerzaClave, limpiarTexto, primerError,
  validarClave, validarConfirmacion, validarCorreoCuenta, validarNombre,
} from '@/lib/validar';

type CampoRegistro = 'name' | 'email' | 'password' | 'confirmPassword';

const claseInput = (error?: string | null, extra = '') =>
  `w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color] duration-150 text-base sm:text-sm placeholder-neutral-400 ${error ? 'border-profe' : 'border-slate-300'} ${extra}`;

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<Partial<Record<CampoRegistro, string | null>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const enviando = useRef(false);
  const router = useRouter();
  const { login } = useAuth();
  const anti = useAntiSpam('registro');

  const fuerza = fuerzaClave(password);
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthTextColors = ['text-tenue', 'text-profe', 'text-grafito', 'text-eco'];

  const validar = () => ({
    name: validarNombre(name),
    email: validarCorreoCuenta(email),
    password: validarClave(password),
    confirmPassword: validarConfirmacion(password, confirmPassword),
  });
  /** Al salir de un campo con algo escrito (o que ya tenía error) se revalida solo ese campo. */
  const alSalir = (campo: CampoRegistro, valor: string) => {
    if (!valor && !errores[campo]) return;
    setErrores(e => ({ ...e, [campo]: validar()[campo] }));
  };
  const cambiar = (campo: CampoRegistro, set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    if (errores[campo]) setErrores(x => ({ ...x, [campo]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando.current) return;
    setError('');
    const errs = validar();
    setErrores(errs);
    const primero = primerError(errs);
    if (primero) { enfocar(primero); return; }
    if (!acepto) { setIntentado(true); document.querySelector<HTMLInputElement>('input[name=aceptoTerminos]')?.focus(); return; }
    const limite = anti.revisar();
    if (limite) { setError(limite); return; }

    enviando.current = true;
    setIsLoading(true);
    const correo = email.trim().toLowerCase();
    try {
      await authApi.register(correo, password, limpiarTexto(name), await anti.datos());
      anti.anotar();
      await login(correo, password);
      router.push('/');
    } catch (err) {
      setError(mensajeError(err, 'No pudimos crear la cuenta. Inténtalo de nuevo.'));
      enviando.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-sky-100">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Crear cuenta</h1>
          <p className="text-tenue text-sm">Únete a Ready y arma la lista escolar de tus hijos</p>
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-[20px] shadow-[0px_6px_20px_-2px_rgba(0,0,0,0.10)]">
          <div className="flex gap-2 mb-6">
            <Link href="/login" className="flex-1 py-2.5 text-center rounded-xl font-medium text-sm bg-white text-blue-500 border border-slate-200 hover:bg-slate-50 transition-colors">
              Iniciar sesión
            </Link>
            <span aria-current="page" className="flex-1 py-2.5 text-center rounded-xl font-medium text-sm bg-blue-500 text-white shadow-md shadow-blue-500/20">
              Registrarse
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="relative space-y-4" aria-busy={isLoading}>
            <AvisoError>{error}</AvisoError>
            <CampoTrampa {...anti.trampa} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
              <input type="text" id="name" name="name" autoComplete="name" maxLength={LARGO.nombre} value={name}
                onChange={cambiar('name', setName)} onBlur={e => alSalir('name', e.target.value)} required {...ariaCampo('name', errores.name)}
                className={claseInput(errores.name)} placeholder="Tu nombre y apellido" />
              <ErrorCampo id="name" error={errores.name} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
              <input type="email" id="email" name="email" autoComplete="email" inputMode="email" maxLength={LARGO.correo} value={email}
                onChange={cambiar('email', setEmail)} onBlur={e => alSalir('email', e.target.value)} required {...ariaCampo('email', errores.email)}
                className={claseInput(errores.email)} placeholder="tu@correo.com" />
              <ErrorCampo id="email" error={errores.email} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="password" name="new-password" autoComplete="new-password" minLength={8} maxLength={LARGO.clave}
                  value={password} onChange={cambiar('password', setPassword)} onBlur={e => alSalir('password', e.target.value)} required
                  aria-invalid={errores.password ? true : undefined} aria-describedby={errores.password ? 'password-error' : 'password-ayuda'}
                  className={claseInput(errores.password, 'pr-12')} placeholder="Mínimo 8 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-tenue hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <ErrorCampo id="password" error={errores.password} />
              <div className="mt-2" id="password-ayuda">
                <div className="flex gap-1 mb-1" aria-hidden="true">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= fuerza.nivel ? strengthColors[fuerza.nivel] : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className={`text-xs ${strengthTextColors[fuerza.nivel]}`} aria-live="polite">
                  {fuerza.texto && <b>{fuerza.texto}. </b>}<span className="text-tenue">{fuerza.pista}</span>
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
              <input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirm-password" autoComplete="new-password" maxLength={LARGO.clave}
                value={confirmPassword} onChange={cambiar('confirmPassword', setConfirmPassword)} onBlur={e => alSalir('confirmPassword', e.target.value)} required
                {...ariaCampo('confirmPassword', errores.confirmPassword)}
                className={claseInput(errores.confirmPassword, !errores.confirmPassword && confirmPassword && confirmPassword === password ? '!border-eco' : '')}
                placeholder="Repite tu contraseña" />
              <ErrorCampo id="confirmPassword" error={errores.confirmPassword} />
            </div>

            <AceptoTerminos checked={acepto} onChange={setAcepto} error={intentado && !acepto ? 'Debes aceptar los Términos y la Política de Privacidad.' : null} />
            <button type="submit" disabled={isLoading}
              className="w-full min-h-12 py-3 bg-blue-500 text-white font-bold rounded-xl transition-[opacity,box-shadow] duration-150 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:shadow-lg hover:shadow-blue-500/25">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Creando cuenta…</> : 'Crear mi cuenta'}
            </button>

            <p className="text-center text-sm text-tenue">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-500 hover:text-blue-600 font-semibold transition-colors">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
