'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

/** Enlaces de "Mi cuenta" en el pie: cambian si hay sesión iniciada. */
export default function PieCuenta() {
  const { user, logout, isAdmin } = useAuth();
  const enlace = 'text-tenue hover:text-primario';
  return (
    <nav aria-label="Mi cuenta" className="flex flex-col gap-2 text-sm">
      <p className="font-semibold text-grafito">Mi cuenta</p>
      {user ? (
        <>
          <Link href="/profile" className={enlace}>Mi perfil</Link>
          <Link href="/my-lists" className={enlace}>Mis listas y pedidos</Link>
          <Link href="/cart" className={enlace}>Carrito</Link>
          {isAdmin && <Link href="/admin" className={enlace}>Panel de administración</Link>}
          <button onClick={logout} className="w-fit cursor-pointer text-left text-tenue hover:text-profe">Cerrar sesión</button>
        </>
      ) : (
        <>
          <Link href="/login" className={enlace}>Iniciar sesión</Link>
          <Link href="/register" className={enlace}>Crear cuenta</Link>
          <Link href="/cart" className={enlace}>Carrito</Link>
        </>
      )}
    </nav>
  );
}
