'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { usersApi } from '@/services/api';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types';
import { Cargando, ROLES, fechaCorta, nombreRol, tarjeta, th, useAvisos } from '../_ui';

const COLOR_ROL: Record<string, string> = { ADMIN: 'bg-red-100 text-red-700', OPERATOR: 'bg-purple-100 text-purple-700', USER: 'bg-slate-100 text-slate-600' };

export default function AdminUsersPage() {
  const avisos = useAvisos();
  const { user: yo } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const load = useCallback(() => usersApi.getAll().then(setUsers)
    .catch(e => avisos.error(e, 'No pudimos cargar los usuarios'))
    .finally(() => setLoading(false)), [avisos]);
  useEffect(() => { load(); }, [load]);

  const changeRole = async (u: User, role: User['role']) => {
    if (u.id === yo?.id && role !== 'ADMIN') { avisos.error(null, 'No puedes quitarte tu propio rol de administrador'); return; }
    if (role === 'ADMIN' && !confirm(`¿Dar acceso total de administrador a ${u.name}?`)) return;
    try { await usersApi.setRole(u.id, role); avisos.exito(`${u.name} ahora es ${nombreRol(role)}`); load(); }
    catch (e) { avisos.error(e, 'No pudimos cambiar el rol'); }
  };

  const q = search.toLowerCase();
  const filtered = users.filter(u => {
    if (q && !u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    if (filterRole && u.role !== filterRole) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Usuarios ({users.length})</h1>

      <div className={`${tarjeta} p-3 mb-4 flex flex-wrap items-center gap-2`}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre o correo…" aria-label="Buscar usuario"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} aria-label="Filtrar por rol" className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      <div className={`${tarjeta} overflow-hidden`}>
        {loading ? <Cargando /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className={th}>Nombre</th>
                <th className={th}>Correo</th>
                <th className={th}>Teléfono</th>
                <th className={th}>Rol</th>
                <th className={th}>Registro</th>
                <th className={`${th} text-center w-36`}>Cambiar rol</th>
              </tr></thead>
              <tbody>
                {filtered.map((u, i) => {
                  const soyYo = u.id === yo?.id;
                  return (
                    <tr key={u.id} data-usuario={u.email} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" aria-hidden="true">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-medium text-slate-900">{u.name}{soyYo && <span className="text-neutral-400 font-normal"> (tú)</span>}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">{u.email}</td>
                      <td className="px-4 py-2 text-xs text-slate-600">{u.phone || '—'}</td>
                      <td className="px-4 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${COLOR_ROL[u.role] ?? COLOR_ROL.USER}`}>{nombreRol(u.role)}</span></td>
                      <td className="px-4 py-2 text-[11px] text-neutral-400 whitespace-nowrap">{u.createdAt ? fechaCorta(u.createdAt) : 'Sin dato'}</td>
                      <td className="px-4 py-2 text-center">
                        <select value={u.role} onChange={e => changeRole(u, e.target.value as User['role'])} disabled={soyYo}
                          aria-label={`Rol de ${u.name}`} title={soyYo ? 'No puedes cambiar tu propio rol' : undefined}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-[11px] disabled:opacity-50">
                          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length === 0 && !loading && <p className="p-8 text-center text-neutral-400 text-sm">No hay usuarios</p>}
      </div>
      <p className="text-[11px] text-neutral-400 mt-3">El operador puede atender pedidos y revisar listas; el administrador además maneja el catálogo, los usuarios y la configuración.</p>
    </div>
  );
}
