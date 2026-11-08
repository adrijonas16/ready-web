import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Imagen para compartir (Open Graph / Twitter): marca, lema y un dibujo de útiles hecho con formas simples.
// Las fuentes son instancias estáticas (TTF) de Rubik y Nunito Sans: ImageResponse no lee woff2 ni fuentes variables.

const C = {
  fondo: '#F8FAFC', cuadricula: '#E4ECFC', texto: '#0F172A', tenue: '#475569',
  azul: '#1D4ED8', azulOscuro: '#1E3A8A', ambar: '#F59E0B', ambarClaro: '#FEF3C7', verde: '#059669', morado: '#7C3AED', rojo: '#DC2626', papel: '#FFFFFF', linea: '#E2E8F0',
};

const fuente = (archivo: string) => readFile(join(process.cwd(), 'src/assets/fonts', archivo));

/** Útiles escolares: hoja de lista con checks, cuaderno, lápiz, regla y crayolas. */
function Utiles() {
  return (
    <svg width="520" height="520" viewBox="0 0 520 520">
      {/* Sombra */}
      <ellipse cx="260" cy="482" rx="210" ry="18" fill="#CBD5E1" />
      {/* Cuaderno azul detrás */}
      <g transform="rotate(-10 200 260)">
        <rect x="70" y="90" width="230" height="310" rx="18" fill={C.azul} />
        <rect x="70" y="90" width="34" height="310" rx="10" fill={C.azulOscuro} />
        <rect x="140" y="140" width="130" height="46" rx="10" fill={C.papel} />
        <rect x="156" y="156" width="96" height="8" rx="4" fill={C.azul} />
        <rect x="156" y="170" width="60" height="6" rx="3" fill="#93C5FD" />
      </g>
      {/* Hoja de la lista */}
      <g transform="rotate(5 330 250)">
        <rect x="200" y="60" width="250" height="340" rx="16" fill={C.papel} stroke={C.linea} strokeWidth="4" />
        <rect x="290" y="44" width="70" height="30" rx="8" fill={C.ambar} />
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <rect x="226" y={112 + i * 54} width="30" height="30" rx="8" fill={i < 4 ? C.verde : C.papel} stroke={i < 4 ? C.verde : '#94A3B8'} strokeWidth="4" />
            {i < 4 && <path d={`M233 ${127 + i * 54} l7 7 l12 -14`} fill="none" stroke={C.papel} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="272" y={120 + i * 54} width={[140, 110, 150, 96, 124][i]} height="12" rx="6" fill={i < 4 ? '#CBD5E1' : '#E2E8F0'} />
          </g>
        ))}
      </g>
      {/* Lápiz */}
      <g transform="translate(6 -34) rotate(-38 330 420)">
        <rect x="180" y="400" width="250" height="40" rx="6" fill={C.ambar} />
        <rect x="180" y="400" width="250" height="13" fill="#FBBF24" />
        <rect x="430" y="400" width="26" height="40" fill="#94A3B8" />
        <rect x="456" y="400" width="26" height="40" rx="8" fill="#F472B6" />
        <path d="M180 400 L132 420 L180 440 Z" fill="#F5D0A9" />
        <path d="M148 413 L132 420 L148 427 Z" fill={C.texto} />
      </g>
      {/* Regla */}
      <g transform="rotate(14 120 440)">
        <rect x="20" y="420" width="220" height="44" rx="8" fill="#FDE68A" stroke="#D97706" strokeWidth="3" />
        {Array.from({ length: 11 }, (_, i) => <rect key={i} x={36 + i * 19} y="420" width="4" height={i % 2 ? 14 : 22} fill="#B45309" />)}
      </g>
      {/* Crayolas */}
      {[C.rojo, C.verde, C.morado].map((color, i) => (
        <g key={color} transform={`rotate(${-12 + i * 10} ${440 + i * 26} 150)`}>
          <rect x={430 + i * 26} y="90" width="22" height="110" rx="4" fill={color} />
          <path d={`M${430 + i * 26} 90 L${441 + i * 26} 66 L${452 + i * 26} 90 Z`} fill={color} />
          <rect x={430 + i * 26} y="120" width="22" height="10" fill="#0F172A" opacity="0.25" />
        </g>
      ))}
    </svg>
  );
}

function Marca() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="76" height="76" viewBox="0 0 32 32">
        <rect x="2" y="4" width="24" height="24" rx="6" fill={C.azul} />
        <path d="M8.5 16.5l5 5L29 6" fill="none" stroke={C.ambar} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: 'Rubik Black Italic', fontSize: 64, color: C.texto, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1 }}>Ready</span>
    </div>
  );
}

export async function imagenParaCompartir(size: { width: number; height: number }) {
  const [negraCursiva, extraNegrita, texto] = await Promise.all([
    fuente('Rubik-BlackItalic.ttf'), fuente('Rubik-ExtraBold.ttf'), fuente('NunitoSans-Bold.ttf'),
  ]);
  const chip = (t: string, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 999, background: C.papel, border: `3px solid ${color}`, color, fontSize: 26 }}>
      <div style={{ width: 14, height: 14, borderRadius: 999, background: color }} />{t}
    </div>
  );
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', background: C.fondo, fontFamily: 'Nunito Sans',
        backgroundImage: `linear-gradient(${C.cuadricula} 2px, transparent 2px), linear-gradient(90deg, ${C.cuadricula} 2px, transparent 2px)`,
        backgroundSize: '40px 40px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 72px', width: 680 }}>
          <Marca />
          <div style={{ display: 'flex', marginTop: 34, fontFamily: 'Rubik ExtraBold', fontSize: 70, lineHeight: 1.04, letterSpacing: -2, color: C.texto }}>
            Tu lista de útiles, lista en minutos
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 30, lineHeight: 1.35, color: C.tenue }}>
            Sube la foto de la lista del colegio y recíbela completa en casa, en Arequipa.
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
            {chip('Económica', C.verde)}{chip('Normal', C.azul)}{chip('Premium', C.morado)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 520 }}>
          <Utiles />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14, display: 'flex' }}>
          <div style={{ flex: 3, background: C.azul }} /><div style={{ flex: 1, background: C.ambar }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Rubik Black Italic', data: negraCursiva, style: 'italic', weight: 900 },
        { name: 'Rubik ExtraBold', data: extraNegrita, style: 'normal', weight: 800 },
        { name: 'Nunito Sans', data: texto, style: 'normal', weight: 700 },
      ],
    },
  );
}
