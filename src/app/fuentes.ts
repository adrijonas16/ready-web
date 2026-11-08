// Fuentes propias (sin Google Fonts): solo el subconjunto latino, que incluye tildes, ñ, ¿ y ¡.
// next/font las sirve desde el mismo dominio, precarga las del texto y los títulos, usa
// font-display: swap y ajusta la fuente de respaldo para que la página no salte al cargarlas.
import localFont from 'next/font/local';

export const nunitoSans = localFont({
  src: './fuentes/nunito-sans-latin-wght-normal.woff2',
  weight: '200 1000',
  style: 'normal',
  display: 'swap',
  variable: '--nf-texto',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const rubik = localFont({
  src: [
    { path: './fuentes/rubik-latin-wght-normal.woff2', weight: '300 900', style: 'normal' },
    // Cursiva: solo la usa el logo (subconjunto de letras básicas); no se precarga
  ],
  display: 'swap',
  variable: '--nf-titulos',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const rubikCursiva = localFont({
  src: './fuentes/rubik-latin-wght-italic.woff2',
  weight: '300 900',
  style: 'italic',
  display: 'swap',
  preload: false,
  variable: '--nf-titulos-cursiva',
  adjustFontFallback: false,
});

/** Letra a mano (Caveat): adornos; no se precarga para no competir con el contenido principal. */
export const caveat = localFont({
  src: [
    { path: './fuentes/caveat-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fuentes/caveat-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  variable: '--nf-mano',
  fallback: ['Comic Sans MS', 'cursive'],
  adjustFontFallback: false,
});

export const clasesFuentes = [nunitoSans.variable, rubik.variable, rubikCursiva.variable, caveat.variable].join(' ');
