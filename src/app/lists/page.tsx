'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Camera, ChevronRight, GraduationCap, ShoppingBag } from 'lucide-react';
import { listsApi, schoolsApi, sectionsApi } from '@/services/api';
import { SupplyList, School, Section } from '@/lib/types';
import SearchSelect from '@/components/SearchSelect';
import Escudo from '@/components/Escudo';
import { productos } from '@/demo/catalogo';

// Útiles típicos de cada nivel para ilustrar la tarjeta
const UTILES_NIVEL: [RegExp, string[]][] = [
  [/inicial/i, ['cr-m', 'pa-m', 'te-m']],
  [/secundaria/i, ['cu-p', 'lp-m', 're-m']],
  [/./, ['cu-dibujos', 'co-m', 'ti-m']],
];
const utilesDe = (grado: string) => (UTILES_NIVEL.find(([r]) => r.test(grado))?.[1] ?? []).map(id => productos.find(p => p.id === id)?.imageUrl);

/** Listas aprobadas por colegio: el cliente elige la suya y compra. */
export default function ListsPage() {
  const [listas, setListas] = useState<SupplyList[]>([]);
  const [colegios, setColegios] = useState<School[]>([]);
  const [colegio, setColegio] = useState('');
  const [grado, setGrado] = useState('');
  const [secciones, setSecciones] = useState<Section[]>([]);
  const [seccionesColegio, setSeccionesColegio] = useState<Section[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([listsApi.getOfficial(), schoolsApi.getAll(), sectionsApi.getAll()])
      .then(([l, c, s]) => { setListas(l); setColegios(c); setSecciones(s); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const elegirColegio = (v: string) => {
    if (v !== colegio) {
      setGrado('');
      if (!v) setSeccionesColegio([]);
    }
    setColegio(v);
  };

  useEffect(() => {
    if (!colegio) return;
    schoolsApi.getSchoolSections(colegio).then(setSeccionesColegio).catch(() => setSeccionesColegio([]));
  }, [colegio]);

  const aprobadas = useMemo(() => listas.filter(l => l.estado === 'VALIDADA' || l.estado === 'PROCESADA'), [listas]);
  const conLista = useMemo(() => new Set(aprobadas.map(l => l.schoolId)), [aprobadas]);
  const visibles = aprobadas
    .filter(l => (!colegio || l.schoolId === colegio) && (!grado || l.gradeName === grado))
    .sort((a, b) => b.year - a.year || a.gradeName.localeCompare(b.gradeName, 'es', { numeric: true }));
  const nombreColegio = colegios.find(c => c.id === colegio)?.name;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">Busca la lista de tu colegio</h1>
      <p className="mt-2 max-w-2xl text-lg text-tenue">
        Estas listas ya están revisadas por nuestro equipo. Eliges la tuya, la armas en Económico, Normal o Premium y compras.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-linea bg-papel p-4 sm:grid-cols-[1.6fr_1fr] sm:p-5">
        <div>
          <label className="mb-1 block text-sm font-semibold">Colegio</label>
          <SearchSelect value={colegio} onChange={elegirColegio} placeholder="Escribe el nombre de tu colegio…"
            options={colegios.map(c => ({ value: c.id, label: conLista.has(c.id) ? c.name : `${c.name} (sin lista aún)` }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Grado</label>
          <SearchSelect value={grado} onChange={setGrado} placeholder={colegio ? 'Todos los grados' : 'Primero el colegio'} disabled={!colegio}
            options={(seccionesColegio.length ? seccionesColegio : secciones).map(s => ({ value: s.name, label: s.name, group: s.groupName }))} />
        </div>
      </div>

      <section aria-live="polite" className="mt-8">
        {cargando ? (
          <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-linea bg-papel px-6 py-10 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-tenue/50" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold">Aún no tenemos la lista de {grado ? `${grado} de ` : ''}{nombreColegio}</h2>
            <p className="mt-1 text-tenue">Súbela tú y la armamos, o compra los útiles uno por uno.</p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-xl bg-acento px-5 py-3 font-bold text-grafito hover:bg-acento-oscuro">
                <Camera className="h-4 w-4" aria-hidden="true" /> Subir mi lista
              </Link>
              <Link href="/catalog" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-grafito px-5 py-3 font-bold hover:bg-fondo">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Armar mi pedido
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-3 font-bold">
              {colegio
                ? `${visibles.length} ${visibles.length === 1 ? 'lista' : 'listas'} de ${nombreColegio}`
                : `${aprobadas.length} listas de ${conLista.size} colegios`}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {visibles.map((l, i) => (
                <li key={l.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <Link href={`/lists/${l.id}`}
                    className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-linea bg-papel p-4 transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:border-primario/50 hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)]">
                    <Escudo nombre={l.schoolName} className="h-14 w-12 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{l.gradeName}</span>
                      {!colegio && <span className="block truncate text-sm font-semibold text-grafito">{l.schoolName}</span>}
                      <span className="block text-sm text-tenue">{l.esOficial ? 'Lista oficial' : 'Lista'} {l.year}</span>
                    </span>
                    <span className="relative hidden h-14 w-24 shrink-0 sm:block" aria-hidden="true">
                      {utilesDe(l.gradeName).map((src, k) => (
                        <img key={k} src={src} alt="" className={`absolute top-1 h-12 w-12 object-contain transition-[translate] duration-500 ease-out ${['group-hover:-translate-x-2', 'group-hover:-translate-y-1.5', 'group-hover:translate-x-2'][k]}`}
                          style={{ left: k * 22, zIndex: 3 - k, rotate: `${(k - 1) * 12}deg` }} />
                      ))}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-primario">
                      Ver <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
