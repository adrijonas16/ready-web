'use client';

import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'oscuro' | 'sistema';
import { CLAVE_TEMA as CLAVE } from './tema-script';

function aplicar(tema: Tema) {
  const oscuro = tema === 'oscuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = oscuro ? 'dark' : 'light';
}

export function useTema() {
  const [tema, setTemaState] = useState<Tema>('sistema');
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    let guardado: Tema = 'sistema';
    try { guardado = (localStorage.getItem(CLAVE) as Tema) || 'sistema'; } catch { /* sin almacenamiento */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una sola vez del navegador
    setTemaState(guardado);
    setOscuro(document.documentElement.dataset.theme === 'dark');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const cambio = () => {
      let actual: Tema = 'sistema';
      try { actual = (localStorage.getItem(CLAVE) as Tema) || 'sistema'; } catch { /* nada */ }
      if (actual === 'sistema') { aplicar('sistema'); setOscuro(mq.matches); }
    };
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);

  const setTema = useCallback((t: Tema) => {
    try { localStorage.setItem(CLAVE, t); } catch { /* sin almacenamiento */ }
    aplicar(t);
    setTemaState(t);
    setOscuro(document.documentElement.dataset.theme === 'dark');
  }, []);

  return { tema, oscuro, setTema, alternar: () => setTema(oscuro ? 'claro' : 'oscuro') };
}
