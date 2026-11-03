export const CLAVE_TEMA = 'ready-tema';

/** Script que corre antes de pintar la página: evita el destello blanco en modo oscuro. */
export const scriptTema = `(function(){try{var t=localStorage.getItem('${CLAVE_TEMA}');var o=t==='oscuro'||((!t||t==='sistema')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=o?'dark':'light';}catch(e){}})();`;

