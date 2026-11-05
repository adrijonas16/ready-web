'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, ClipboardList, Loader2, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/services/api';
import { validarCelular, validarDireccion } from '@/lib/validar';

const claseCampo = (error?: string | null) =>
  `w-full rounded-xl border bg-papel px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 ${error ? 'border-profe focus-visible:ring-profe/25' : 'border-linea focus:border-primario focus-visible:ring-primario/25'}`;

type Campo = 'name' | 'phone' | 'address' | 'documento';

function validarDocumento(v: string): string | null {
  if (!v.trim()) return null;
  return /^\d{8}$/.test(v) || /^\d{11}$/.test(v) ? null : 'Escribe un DNI de 8 dígitos o un RUC de 11.';
}

export default function PerfilPage() {
  const { user, isLoading, guardarPerfil, logout } = useAuth();
  const [datos, setDatos] = useState<Record<Campo, string>>({ name: '', phone: '', address: '', documento: '' });
  const [errores, setErrores] = useState<Partial<Record<Campo, string | null>>>({});
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  // Se piden los datos al servidor (GET /auth/me) para no mostrar una copia vieja del navegador
  useEffect(() => {
    if (!user) return;
    let vivo = true;
    authApi.getCurrentUser().catch(() => user).then(u => {
      if (!vivo) return;
      setDatos({ name: u.name ?? '', phone: u.phone ?? '', address: u.address ?? '', documento: u.documento ?? '' });
      setCargado(true);
    });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de usuario
  }, [user?.id]);

  const validar = (d = datos) => ({
    name: d.name.trim().length < 2 ? 'Escribe tu nombre.' : null,
    phone: d.phone.trim() ? validarCelular(d.phone) : null,
    address: d.address.trim() ? validarDireccion(d.address) : null,
    documento: validarDocumento(d.documento),
  });

  const cambiar = (campo: Campo, valor: string) => {
    setDatos(d => ({ ...d, [campo]: valor }));
    setMensaje(null);
    if (errores[campo]) setErrores(e => ({ ...e, [campo]: null }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validar();
    setErrores(errs);
    const primero = (Object.keys(errs) as Campo[]).find(k => errs[k]);
    if (primero) { document.getElementById(`perfil-${primero}`)?.focus(); return; }
    setGuardando(true);
    try {
      await guardarPerfil({ name: datos.name.trim(), phone: datos.phone.trim(), address: datos.address.trim(), documento: datos.documento.trim() });
      setMensaje({ ok: true, texto: 'Guardamos tus datos. Los usaremos para llenar tu próxima compra.' });
    } catch {
      setMensaje({ ok: false, texto: 'No pudimos guardar tus datos. Intenta de nuevo.' });
    } finally { setGuardando(false); }
  };

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        {!isLoading && (
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-extrabold">Inicia sesión para ver tu perfil</h1>
            <p className="mb-6 text-tenue">Guarda tu dirección y celular para comprar más rápido.</p>
            <Link href="/login?redirect=/profile" className="rounded-xl bg-primario px-5 py-3 font-bold text-white hover:bg-primario-oscuro">Iniciar sesión</Link>
          </div>
        )}
      </div>
    );
  }

  const campo = (c: Campo, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement> & { ayuda?: string; obligatorio?: boolean }) => {
    const { ayuda, obligatorio, ...attrs } = extra;
    return (
      <div>
        <label htmlFor={`perfil-${c}`} className="mb-1 block text-sm font-semibold">
          {etiqueta}{obligatorio ? <span className="text-profe" aria-hidden="true"> *</span> : <span className="font-normal text-tenue"> (opcional)</span>}
        </label>
        <input id={`perfil-${c}`} name={c} value={datos[c]} onChange={e => cambiar(c, e.target.value)}
          aria-invalid={!!errores[c] || undefined} aria-describedby={errores[c] ? `perfil-${c}-error` : ayuda ? `perfil-${c}-ayuda` : undefined}
          className={claseCampo(errores[c])} {...attrs} />
        {errores[c]
          ? <p id={`perfil-${c}-error`} className="mt-1 flex items-start gap-1 text-sm text-profe"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{errores[c]}</p>
          : ayuda && <p id={`perfil-${c}-ayuda`} className="mt-1 text-xs text-tenue">{ayuda}</p>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primario-claro text-2xl font-bold text-primario" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-extrabold tracking-tight">Mi perfil</h1>
          <p className="truncate text-tenue">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 md:grid-cols-[1fr_220px]">
        <form onSubmit={guardar} noValidate className="space-y-4 rounded-2xl border border-linea bg-papel p-5 sm:p-6" aria-busy={!cargado}>
          <h2 className="flex items-center gap-2 font-bold"><UserRound className="h-4 w-4 text-primario" aria-hidden="true" /> Datos para tus pedidos</h2>
          <p className="text-sm text-tenue">Los usamos para llenar el pago. Los campos con <span className="text-profe">*</span> son obligatorios.</p>
          {campo('name', 'Nombre y apellido', { obligatorio: true, autoComplete: 'name', placeholder: 'Ej.: Carmen Quispe' })}
          {campo('phone', 'Celular', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+51 999 123 456', ayuda: '9 dígitos; puedes poner +51.' })}
          {campo('address', 'Dirección de entrega', { autoComplete: 'street-address', placeholder: 'Calle, número, urbanización, distrito…' })}
          {campo('documento', 'DNI o RUC', { inputMode: 'numeric', autoComplete: 'off', maxLength: 11, placeholder: '12345678', ayuda: 'DNI (8 dígitos) para la boleta o RUC (11) para la factura.', onChange: e => cambiar('documento', e.target.value.replace(/\D/g, '').slice(0, 11)) })}
          {mensaje && (
            <p role="status" className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${mensaje.ok ? 'bg-eco-claro' : 'bg-profe-claro text-profe'}`}>
              {mensaje.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-eco" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}{mensaje.texto}
            </p>
          )}
          <button type="submit" disabled={guardando || !cargado}
            className="inline-flex items-center gap-2 rounded-xl bg-primario px-5 py-3 font-bold text-white hover:bg-primario-oscuro disabled:opacity-50">
            {guardando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Guardar cambios
          </button>
        </form>

        <nav aria-label="Mi cuenta" className="space-y-2">
          <Link href="/my-lists" className="flex items-center gap-2 rounded-xl border border-linea bg-papel px-4 py-3 font-semibold hover:border-primario">
            <ClipboardList className="h-4 w-4 text-primario" aria-hidden="true" /> Mis listas y pedidos
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl border border-linea bg-papel px-4 py-3 font-semibold text-profe hover:border-profe">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
          </button>
        </nav>
      </div>
    </div>
  );
}
