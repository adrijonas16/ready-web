// Genera los íconos de la tienda a partir del logo (casilla azul + check ámbar):
//   src/app/favicon.ico (16, 32 y 48 px), src/app/apple-icon.png (180 px)
//   public/icons/icon-192.png, icon-512.png y icon-maskable-512.png (manifest)
// Uso: node scripts/generar-iconos.mjs   (necesita sharp, que ya viene con Next)
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const AZUL = '#1D4ED8', AMBAR = '#F59E0B', FONDO = '#F8FAFC';

/** Logo dentro de un lienzo cuadrado. margen: fracción libre alrededor; fondo: color o null (transparente). */
const svg = (margen = 0, fondo = null, radioFondo = 0) => {
  const lado = 32 / (1 - 2 * margen), o = (lado - 32) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}">
  ${fondo ? `<rect width="${lado}" height="${lado}" rx="${radioFondo * lado}" fill="${fondo}"/>` : ''}
  <g transform="translate(${o} ${o})">
    <rect x="2" y="4" width="24" height="24" rx="6" fill="${AZUL}"/>
    <path d="M8.5 16.5l5 5L29 6" fill="none" stroke="${AMBAR}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g></svg>`);
};
const png = (fuente, tam) => sharp(fuente, { density: 1200 }).resize(tam, tam).png({ compressionLevel: 9 }).toBuffer();

/** .ico con imágenes PNG dentro (formato aceptado por todos los navegadores actuales). */
function ico(imagenes) {
  const cab = Buffer.alloc(6 + 16 * imagenes.length);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(imagenes.length, 4);
  let desplazamiento = cab.length;
  imagenes.forEach(({ tam, datos }, i) => {
    const e = 6 + 16 * i;
    cab.writeUInt8(tam >= 256 ? 0 : tam, e); cab.writeUInt8(tam >= 256 ? 0 : tam, e + 1);
    cab.writeUInt8(0, e + 2); cab.writeUInt8(0, e + 3);
    cab.writeUInt16LE(1, e + 4); cab.writeUInt16LE(32, e + 6);
    cab.writeUInt32LE(datos.length, e + 8); cab.writeUInt32LE(desplazamiento, e + 12);
    desplazamiento += datos.length;
  });
  return Buffer.concat([cab, ...imagenes.map(i => i.datos)]);
}

const favicon = await Promise.all([16, 32, 48].map(async tam => ({ tam, datos: await png(svg(0), tam) })));
await writeFile('src/app/favicon.ico', ico(favicon));
await writeFile('src/app/apple-icon.png', await png(svg(0.14, FONDO), 180));
await writeFile('public/icons/icon-192.png', await png(svg(0.06), 192));
await writeFile('public/icons/icon-512.png', await png(svg(0.06), 512));
// Maskable: el logo dentro de la zona segura (80 % central) sobre fondo sólido
await writeFile('public/icons/icon-maskable-512.png', await png(svg(0.2, FONDO), 512));
console.log('Íconos generados');
