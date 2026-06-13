'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SearchSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchSelect({ options, value, onChange, placeholder = 'Seleccionar', disabled, className }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) { setSearch(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Group options
  const groups = filtered.reduce<Record<string, SelectOption[]>>((acc, o) => {
    const g = o.group || '';
    if (!acc[g]) acc[g] = [];
    acc[g].push(o);
    return acc;
  }, {});

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between gap-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${disabled ? 'bg-slate-50 text-neutral-400 cursor-not-allowed' : 'hover:border-slate-300'}`}
      >
        <span className={selectedLabel ? 'text-slate-900' : 'text-neutral-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full px-3 py-2 text-left text-xs text-neutral-400 hover:bg-slate-50 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpiar seleccion
              </button>
            )}
            {Object.entries(groups).map(([group, opts]) => (
              <div key={group}>
                {group && <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">{group}</div>}
                {opts.map(o => (
                  <button
                    key={o.value}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors ${o.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-neutral-400 text-center">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
