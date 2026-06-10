'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Shield, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await fetch(`${API}/auth/users`); const d = await r.json(); if (d.success) setUsers(d.data); }
    catch {} finally { setLoading(false); }
  };

  const changeRole = async (id: string, role: string) => {
    await fetch(`${API}/auth/users/${id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    load();
  };

  const filtered = users.filter(u => {
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && u.role !== filterRole) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Usuarios ({users.length})</h1>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] p-3 mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre o email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700">
          <option value="">Todos los roles</option>
          <option value="USER">Usuario</option>
          <option value="ADMIN">Admin</option>
          <option value="OPERATOR">Operador</option>
        </select>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div> : (
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Email</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Telefono</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Rol</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Registro</th>
              <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase w-28">Cambiar Rol</th>
            </tr></thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className={`border-b border-slate-100 hover:bg-blue-50/30 ${i % 2 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs font-medium text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600">{u.email}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{u.phone || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'OPERATOR' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-2 text-[10px] text-neutral-400">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-2 text-center">
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-[10px]">
                      <option value="USER">USER</option>
                      <option value="OPERATOR">OPERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length === 0 && !loading && <p className="p-8 text-center text-neutral-400 text-sm">No hay usuarios</p>}
      </div>
    </div>
  );
}
